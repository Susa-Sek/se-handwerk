"""Zentraler Ollama-Client für alle KI-Agenten (Cloud/Lokal)."""

import json
import os
import re
import sys
import time
from datetime import date
from typing import Optional

import ollama

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.client")


class KIClient:
    """Zentraler Ollama-Client mit Retry und Token-Tracking."""

    def __init__(self, config: dict):
        self.config = config
        self.ki_config = config.get("ki", {})

        # Ollama Host (Cloud oder Lokal)
        self.ollama_host = os.getenv(
            "OLLAMA_HOST",
            self.ki_config.get("ollama_host", "http://localhost:11434")
        )

        # API Key (für Ollama Cloud)
        self.api_key = os.getenv("OLLAMA_API_KEY", "")

        # Modellkonfiguration
        self._modell_standard = self.ki_config.get("modell", "glm-5")
        self._modell_strategie = self.ki_config.get("strategie_modell", "glm-5")

        # Auto-Pull Modelle (nur für lokale Hosts)
        self._auto_pull = self.ki_config.get("ollama_auto_pull", False)

        # Client initialisieren mit Authentifizierung
        try:
            # Headers für Authentifizierung (Cloud benötigt Bearer Token)
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            self._client = ollama.Client(host=self.ollama_host, headers=headers)
            self._verfuegbar = True
            logger.info(f"Ollama-Client verbunden: {self.ollama_host}")
            if self.api_key:
                logger.info("Ollama Cloud Authentifizierung aktiv")
        except Exception as e:
            logger.warning(f"Ollama nicht erreichbar: {e} – KI-Funktionen deaktiviert")
            self._client = None
            self._verfuegbar = False

        # Rate-Limit (optional für Cloud)
        self._max_anfragen_pro_minute = self.ki_config.get("max_anfragen_pro_minute", 20)
        self._anfrage_timestamps: list[float] = []

        # Token-Tracking pro Agent pro Tag
        self._token_verbrauch: dict[str, dict[str, int]] = {}
        self._tracking_datum: date = date.today()

    @property
    def ist_verfuegbar(self) -> bool:
        """Prüft ob der Ollama-Client nutzbar ist."""
        return self._verfuegbar

    def anfrage(
        self,
        system_prompt: str,
        user_prompt: str,
        modell: Optional[str] = None,
        json_mode: bool = False,
        max_tokens: int = 500,
        agent_name: str = "unbekannt",
        temperature: float = 0.7,
    ) -> Optional[str]:
        """Einzelne Ollama-Anfrage mit Fehlerbehandlung."""
        if not self.ist_verfuegbar:
            logger.warning("Ollama-Client nicht verfügbar")
            return None

        if not modell:
            modell = self._modell_standard

        # Rate-Limit prüfen
        self._rate_limit_warten()

        # Tages-Tracking zurücksetzen falls neuer Tag
        heute = date.today()
        if heute != self._tracking_datum:
            self._token_verbrauch = {}
            self._tracking_datum = heute

        # Bei json_mode den System-Prompt ergänzen
        effektiver_system_prompt = system_prompt
        if json_mode:
            effektiver_system_prompt += "\n\nAntworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach."

        try:
            # Ollama Chat-Completion
            response = self._client.chat(
                model=modell,
                messages=[
                    {"role": "system", "content": effektiver_system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    # Ollama-Format erzwingen wenn json_mode
                    "format": "json" if json_mode else "",
                },
            )

            # Token-Verbrauch tracken
            if hasattr(response, "prompt_eval_count") and hasattr(response, "eval_count"):
                self._token_tracking(
                    agent_name,
                    response.prompt_eval_count,
                    response.eval_count
                )
                total = response.prompt_eval_count + response.eval_count
            elif hasattr(response, "usage") and response.usage:
                self._token_tracking(
                    agent_name,
                    response.usage.prompt_tokens or 0,
                    response.usage.completion_tokens or 0
                )
                total = (response.usage.prompt_tokens or 0) + (response.usage.completion_tokens or 0)
            else:
                total = "?"

            antwort = response.message.content
            logger.debug(f"Ollama-Anfrage OK ({agent_name}): {total} Tokens")

            # Fallback JSON-Extraktion falls format="json" nicht funktioniert
            if json_mode and not self._ist_json(antwort):
                antwort = self._json_extrahieren(antwort)

            return antwort

        except ollama.ResponseError as e:
            logger.error(f"Ollama Response-Fehler: {e}")
            return None

        except ollama.ConnectionError as e:
            logger.error(f"Ollama Verbindungsfehler: {e}")
            return None

        except Exception as e:
            logger.error(f"Unerwarteter Ollama-Fehler: {e}")
            return None

    def _ist_json(self, text: str) -> bool:
        """Prüft ob Text valides JSON ist."""
        try:
            json.loads(text)
            return True
        except (json.JSONDecodeError, ValueError):
            return False

    def _json_extrahieren(self, text: str) -> str:
        """Extrahiert JSON aus Antworttext."""
        text = text.strip()

        # JSON aus Markdown-Codeblock extrahieren
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if match:
            kandidat = match.group(1).strip()
            if self._ist_json(kandidat):
                return kandidat

        # Erstes { ... } oder [ ... ] Paar finden
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start = text.find(start_char)
            if start == -1:
                continue
            end = text.rfind(end_char)
            if end > start:
                kandidat = text[start:end + 1]
                if self._ist_json(kandidat):
                    return kandidat

        logger.warning("Konnte kein JSON aus der Antwort extrahieren")
        return text

    def _rate_limit_warten(self):
        """Wartet falls nötig, um Rate-Limit einzuhalten."""
        jetzt = time.time()
        # Alte Timestamps entfernen
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

    def token_verbrauch_heute(self) -> dict:
        """Gibt Token-Verbrauch pro Agent zurück."""
        return dict(self._token_verbrauch)

    def modell_laden(self, modell_name: str) -> bool:
        """Lädt ein Modell falls noch nicht vorhanden."""
        try:
            modelle = [m["name"] for m in self._client.list().get("models", [])]
            if modell_name in modelle:
                logger.info(f"Modell {modell_name} bereits geladen")
                return True

            logger.info(f"Lade Modell {modell_name}...")
            self._client.pull(modell_name)
            logger.info(f"Modell {modell_name} erfolgreich geladen")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Laden von {modell_name}: {e}")
            return False