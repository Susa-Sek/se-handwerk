"""Zentraler KI-Client für alle KI-Agenten (Ollama Cloud / Native API)."""

import os
import time
from datetime import datetime, date
from typing import Optional

import requests

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.client")

# Ollama Cloud API Endpoint (Native API)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://ollama.com/api")


class KIClient:
    """Zentraler KI-Client mit Retry, Rate-Limit und Token-Tracking.

    Unterstützt Ollama Cloud (Native API).
    """

    def __init__(self, config: dict):
        self.config = config
        self.ki_config = config.get("ki", {})

        # Ollama API-Key
        self._api_key = os.getenv("OLLAMA_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not self._api_key:
            logger.warning("OLLAMA_API_KEY nicht gesetzt – KI-Funktionen deaktiviert")
        else:
            logger.info("KI-Client initialisiert (Native Ollama API)")

        self._base_url = OLLAMA_BASE_URL
        self._max_anfragen_pro_minute = self.ki_config.get("max_anfragen_pro_minute", 20)
        self._kosten_limit_tag = self.ki_config.get("kosten_limit_tag_euro", 1.0)
        self._anfrage_timestamps: list[float] = []

        # Token-Tracking pro Agent pro Tag
        self._token_verbrauch: dict[str, dict[str, int]] = {}
        self._tracking_datum: date = date.today()

    @property
    def ist_verfuegbar(self) -> bool:
        """Prüft ob der KI-Client nutzbar ist."""
        return self._api_key is not None

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
            modell = self.ki_config.get("openai_modell", "glm-5:cloud")

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
            # Native Ollama API Request
            url = f"{self._base_url}/chat"
            headers = {
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": modell,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.7,
                },
            }

            response = requests.post(url, json=payload, headers=headers, timeout=60)
            response.raise_for_status()

            data = response.json()

            # Antwort extrahieren (GLM-5 nutzt 'thinking' für Extended Thinking)
            message = data.get("message", {})
            antwort = message.get("content", "") or message.get("thinking", "")
            if not antwort:
                logger.error(f"Leere Antwort von Ollama API: {data}")
                return None

            # Token-Verbrauch tracken (falls verfügbar)
            eval_count = data.get("eval_count", 0)
            prompt_eval_count = data.get("prompt_eval_count", 0)
            if eval_count or prompt_eval_count:
                self._token_tracking(agent_name, prompt_eval_count, eval_count)

            logger.debug(
                f"KI-Anfrage OK ({agent_name}): {prompt_eval_count + eval_count} Tokens"
            )
            return antwort

        except requests.exceptions.Timeout:
            logger.error("Ollama API Timeout")
            return None

        except requests.exceptions.ConnectionError as e:
            logger.error(f"Ollama Verbindungsfehler: {e}")
            return None

        except requests.exceptions.HTTPError as e:
            logger.error(f"Ollama API-Fehler: {e}")
            if e.response is not None:
                logger.error(f"Response: {e.response.text}")
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
        # GLM-5 Kostenschätzung (Ollama Cloud Pricing)
        # Ca. $0.10/1M input, $0.10/1M output (angenommen)
        gesamt_prompt = sum(
            d["prompt_tokens"] for d in self._token_verbrauch.values()
        )
        gesamt_completion = sum(
            d["completion_tokens"] for d in self._token_verbrauch.values()
        )
        # Preis pro 1M Token (in USD)
        preis_input = self.ki_config.get("preis_input_pro_million", 0.10)
        preis_output = self.ki_config.get("preis_output_pro_million", 0.10)
        kosten_usd = (gesamt_prompt * preis_input / 1_000_000) + (gesamt_completion * preis_output / 1_000_000)
        kosten_eur = kosten_usd * 0.93  # Grobe USD→EUR Umrechnung
        return kosten_eur >= self._kosten_limit_tag

    def token_verbrauch_heute(self) -> dict:
        """Gibt Token-Verbrauch pro Agent zurück."""
        return dict(self._token_verbrauch)
