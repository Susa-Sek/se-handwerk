"""Zentraler Anthropic-Client für alle KI-Agenten."""

import json
import os
import re
import time
from datetime import date
from typing import Optional

import anthropic

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.client")


class KIClient:
    """Zentraler Anthropic-Client mit Retry, Rate-Limit und Token-Tracking."""

    def __init__(self, config: dict):
        self.config = config
        self.ki_config = config.get("ki", {})
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY nicht gesetzt – KI-Funktionen deaktiviert")
            self._client = None
        else:
            self._client = anthropic.Anthropic(api_key=api_key)

        self._max_anfragen_pro_minute = self.ki_config.get("max_anfragen_pro_minute", 20)
        self._kosten_limit_tag = self.ki_config.get("kosten_limit_tag_euro", 1.0)
        self._anfrage_timestamps: list[float] = []

        # Token-Tracking pro Agent pro Tag
        self._token_verbrauch: dict[str, dict[str, int]] = {}
        self._tracking_datum: date = date.today()

    @property
    def ist_verfuegbar(self) -> bool:
        """Prüft ob der KI-Client nutzbar ist."""
        return self._client is not None

    def anfrage(
        self,
        system_prompt: str,
        user_prompt: str,
        modell: Optional[str] = None,
        json_mode: bool = False,
        max_tokens: int = 500,
        agent_name: str = "unbekannt",
    ) -> Optional[str]:
        """Einzelne API-Anfrage mit Fehlerbehandlung und Rate-Limiting."""
        if not self.ist_verfuegbar:
            logger.warning("KI-Client nicht verfügbar (kein API-Key)")
            return None

        if not modell:
            modell = self.ki_config.get("modell", "claude-3-haiku-20240307")

        # Rate-Limit prüfen
        self._rate_limit_warten()

        # Tages-Tracking zurücksetzen falls neuer Tag
        heute = date.today()
        if heute != self._tracking_datum:
            self._token_verbrauch = {}
            self._tracking_datum = heute

        # Kosten-Limit prüfen
        if self._tages_kosten_ueberschritten():
            logger.warning(
                f"Tägliches Kostenlimit ({self._kosten_limit_tag}€) erreicht – "
                f"Anfrage übersprungen"
            )
            return None

        # Bei json_mode den System-Prompt ergänzen
        effektiver_system_prompt = system_prompt
        if json_mode:
            effektiver_system_prompt += "\n\nAntworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach."

        try:
            response = self._client.messages.create(
                model=modell,
                max_tokens=max_tokens,
                system=effektiver_system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt},
                ],
            )

            # Token-Verbrauch tracken
            usage = response.usage
            if usage:
                self._token_tracking(agent_name, usage.input_tokens, usage.output_tokens)

            antwort = response.content[0].text
            total = (usage.input_tokens + usage.output_tokens) if usage else "?"
            logger.debug(f"KI-Anfrage OK ({agent_name}): {total} Tokens")

            # Bei json_mode: JSON aus der Antwort extrahieren
            if json_mode:
                antwort = self._json_extrahieren(antwort)

            return antwort

        except anthropic.RateLimitError as e:
            logger.warning(f"Anthropic Rate-Limit: {e} – warte 30s")
            time.sleep(30)
            return self.anfrage(system_prompt, user_prompt, modell, json_mode, max_tokens, agent_name)

        except anthropic.APIConnectionError as e:
            logger.error(f"Anthropic Verbindungsfehler: {e}")
            return None

        except anthropic.APIError as e:
            logger.error(f"Anthropic API-Fehler: {e}")
            return None

        except Exception as e:
            logger.error(f"Unerwarteter KI-Fehler: {e}")
            return None

    def _json_extrahieren(self, text: str) -> str:
        """Extrahiert JSON aus Antworttext, falls Claude es in Text einbettet."""
        text = text.strip()

        # Schon valides JSON?
        try:
            json.loads(text)
            return text
        except (json.JSONDecodeError, ValueError):
            pass

        # JSON aus Markdown-Codeblock extrahieren
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if match:
            kandidat = match.group(1).strip()
            try:
                json.loads(kandidat)
                return kandidat
            except (json.JSONDecodeError, ValueError):
                pass

        # Erstes { ... } oder [ ... ] Paar finden
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start = text.find(start_char)
            if start == -1:
                continue
            # Von hinten das letzte passende Zeichen suchen
            end = text.rfind(end_char)
            if end > start:
                kandidat = text[start:end + 1]
                try:
                    json.loads(kandidat)
                    return kandidat
                except (json.JSONDecodeError, ValueError):
                    pass

        logger.warning("Konnte kein JSON aus der Antwort extrahieren")
        return text

    def _rate_limit_warten(self):
        """Wartet falls nötig, um Rate-Limit einzuhalten."""
        jetzt = time.time()
        # Alte Timestamps entfernen (älter als 60 Sekunden)
        self._anfrage_timestamps = [
            ts for ts in self._anfrage_timestamps if jetzt - ts < 60
        ]
        if len(self._anfrage_timestamps) >= self._max_anfragen_pro_minute:
            wartezeit = 60 - (jetzt - self._anfrage_timestamps[0])
            if wartezeit > 0:
                logger.debug(f"Rate-Limit: warte {wartezeit:.1f}s")
                time.sleep(wartezeit)
        self._anfrage_timestamps.append(time.time())

    def _token_tracking(self, agent_name: str, input_tokens: int, output_tokens: int):
        """Trackt Token-Verbrauch pro Agent."""
        if agent_name not in self._token_verbrauch:
            self._token_verbrauch[agent_name] = {
                "input_tokens": 0,
                "output_tokens": 0,
                "anfragen": 0,
            }
        self._token_verbrauch[agent_name]["input_tokens"] += input_tokens
        self._token_verbrauch[agent_name]["output_tokens"] += output_tokens
        self._token_verbrauch[agent_name]["anfragen"] += 1

    def _tages_kosten_ueberschritten(self) -> bool:
        """Schätzt ob das Tageslimit überschritten wurde."""
        # Kostenschätzung Claude Haiku: $0.80/1M input, $4.00/1M output
        # Claude Sonnet: $3.00/1M input, $15.00/1M output
        gesamt_input = sum(
            d["input_tokens"] for d in self._token_verbrauch.values()
        )
        gesamt_output = sum(
            d["output_tokens"] for d in self._token_verbrauch.values()
        )
        kosten_usd = (gesamt_input * 0.0000008) + (gesamt_output * 0.000004)
        kosten_eur = kosten_usd * 0.93  # Grobe USD→EUR Umrechnung
        return kosten_eur >= self._kosten_limit_tag

    def token_verbrauch_heute(self) -> dict:
        """Gibt Token-Verbrauch pro Agent zurück."""
        return dict(self._token_verbrauch)
