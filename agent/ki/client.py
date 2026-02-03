"""Zentraler OpenAI-Client für alle KI-Agenten."""

import os
import time
from datetime import datetime, date
from typing import Optional

from openai import OpenAI, APIError, RateLimitError, APIConnectionError

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.client")


class KIClient:
    """Zentraler OpenAI-Client mit Retry, Rate-Limit und Token-Tracking."""

    def __init__(self, config: dict):
        self.config = config
        self.ki_config = config.get("ki", {})
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY nicht gesetzt – KI-Funktionen deaktiviert")
            self._client = None
        else:
            self._client = OpenAI(api_key=api_key)

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
            modell = self.ki_config.get("openai_modell", "gpt-4o-mini")

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

        try:
            kwargs = {
                "model": modell,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.7,
            }

            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = self._client.chat.completions.create(**kwargs)

            # Token-Verbrauch tracken
            usage = response.usage
            if usage:
                self._token_tracking(agent_name, usage.prompt_tokens, usage.completion_tokens)

            antwort = response.choices[0].message.content
            logger.debug(
                f"KI-Anfrage OK ({agent_name}): {usage.total_tokens if usage else '?'} Tokens"
            )
            return antwort

        except RateLimitError as e:
            logger.warning(f"OpenAI Rate-Limit: {e} – warte 30s")
            time.sleep(30)
            return self.anfrage(system_prompt, user_prompt, modell, json_mode, max_tokens, agent_name)

        except APIConnectionError as e:
            logger.error(f"OpenAI Verbindungsfehler: {e}")
            return None

        except APIError as e:
            logger.error(f"OpenAI API-Fehler: {e}")
            return None

        except Exception as e:
            logger.error(f"Unerwarteter KI-Fehler: {e}")
            return None

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

    def _token_tracking(self, agent_name: str, prompt_tokens: int, completion_tokens: int):
        """Trackt Token-Verbrauch pro Agent."""
        if agent_name not in self._token_verbrauch:
            self._token_verbrauch[agent_name] = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "anfragen": 0,
            }
        self._token_verbrauch[agent_name]["prompt_tokens"] += prompt_tokens
        self._token_verbrauch[agent_name]["completion_tokens"] += completion_tokens
        self._token_verbrauch[agent_name]["anfragen"] += 1

    def _tages_kosten_ueberschritten(self) -> bool:
        """Schätzt ob das Tageslimit überschritten wurde."""
        # Grobe Kostenschätzung: gpt-4o-mini ~$0.15/1M input, ~$0.60/1M output
        gesamt_prompt = sum(
            d["prompt_tokens"] for d in self._token_verbrauch.values()
        )
        gesamt_completion = sum(
            d["completion_tokens"] for d in self._token_verbrauch.values()
        )
        kosten_usd = (gesamt_prompt * 0.00000015) + (gesamt_completion * 0.0000006)
        kosten_eur = kosten_usd * 0.93  # Grobe USD→EUR Umrechnung
        return kosten_eur >= self._kosten_limit_tag

    def token_verbrauch_heute(self) -> dict:
        """Gibt Token-Verbrauch pro Agent zurück."""
        return dict(self._token_verbrauch)
