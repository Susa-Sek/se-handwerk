"""Zentraler KI-Client für alle KI-Agenten — nutzt Claude Code CLI (kein API-Key nötig)."""

import json
import re
import shutil
import subprocess
import time
from datetime import date
from typing import Optional

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.client")


def json_extrahieren(text: str) -> Optional[dict | list]:
    """Extrahiert JSON aus Text mit Markdown-Code-Blöcken oder anderem Kontext."""
    if not text:
        return None

    text = text.strip()

    # 1. Direktes JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Markdown-Code-Block
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # 3. JSON-Objekt oder Array im Text finden
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start_idx = text.find(start_char)
        if start_idx != -1:
            depth = 0
            in_string = False
            escape_next = False
            for i, char in enumerate(text[start_idx:], start_idx):
                if escape_next:
                    escape_next = False
                    continue
                if char == '\\':
                    escape_next = True
                    continue
                if char == '"' and not escape_next:
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if char == start_char:
                    depth += 1
                elif char == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start_idx:i+1])
                        except json.JSONDecodeError:
                            break

    logger.warning(f"Konnte kein JSON extrahieren aus: {text[:200]}...")
    return None


class KIClient:
    """KI-Client der claude CLI als Subprocess aufruft.

    Nutzt die bestehende Claude Code Authentifizierung — kein eigener API-Key nötig.
    Fallback: ist_verfuegbar=False wenn claude nicht im PATH gefunden wird
    (z.B. in GitHub Actions → Rule-Based Scorer übernimmt).
    """

    MODELL_SCHNELL = "haiku"   # claude --model haiku
    MODELL_STARK   = "sonnet"  # claude --model sonnet

    def __init__(self, config: dict):
        self.config = config
        self.ki_config = config.get("ki", {})

        self._claude_pfad = shutil.which("claude")
        if not self._claude_pfad:
            logger.warning("claude CLI nicht gefunden – KI deaktiviert (Fallback auf Regeln)")
        else:
            logger.info(f"KI-Client initialisiert (Claude Code CLI)")

        self._max_anfragen_pro_minute = self.ki_config.get("max_anfragen_pro_minute", 10)
        self._anfrage_timestamps: list[float] = []
        self._token_verbrauch: dict[str, dict[str, int]] = {}
        self._tracking_datum: date = date.today()

    @property
    def ist_verfuegbar(self) -> bool:
        return self._claude_pfad is not None

    def anfrage(
        self,
        system_prompt: str,
        user_prompt: str,
        modell: Optional[str] = None,
        json_mode: bool = False,
        max_tokens: int = 500,
        agent_name: str = "unbekannt",
    ) -> Optional[str]:
        """Sendet eine Anfrage via `claude -p` und gibt die Antwort zurück."""
        if not self.ist_verfuegbar:
            logger.warning("claude CLI nicht verfügbar")
            return None

        if not modell:
            modell = self.ki_config.get("modell", self.MODELL_SCHNELL)

        self._rate_limit_warten()

        # Tages-Tracking zurücksetzen
        heute = date.today()
        if heute != self._tracking_datum:
            self._token_verbrauch = {}
            self._tracking_datum = heute

        # System-Prompt als XML-Tags im Prompt einbetten
        # (vermeidet --append-system-prompt welches Claude Code's eigenen Kontext erweitert)
        vollstaendiger_prompt = (
            f"<system>\n{system_prompt}\n</system>\n\n"
            f"<user>\n{user_prompt}\n</user>"
        )

        cmd = [
            self._claude_pfad,
            "-p", vollstaendiger_prompt,
            "--output-format", "text",
            "--no-session-persistence",
            "--model", modell,
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,
            )

            if result.returncode != 0:
                logger.error(
                    f"claude CLI Fehler ({agent_name}, exit {result.returncode}): "
                    f"{result.stderr[:300]}"
                )
                return None

            antwort = result.stdout.strip()
            if not antwort:
                logger.warning(f"Leere Antwort von claude CLI ({agent_name})")
                return None

            # Token-Schätzung: ~4 Zeichen = 1 Token
            prompt_tokens = len(vollstaendiger_prompt) // 4
            completion_tokens = len(antwort) // 4
            self._token_tracking(agent_name, prompt_tokens, completion_tokens)

            logger.debug(f"claude CLI OK ({agent_name}): {len(antwort)} Zeichen")
            return antwort

        except subprocess.TimeoutExpired:
            logger.error(f"claude CLI Timeout nach 120s ({agent_name})")
            return None
        except FileNotFoundError:
            logger.error("claude CLI nicht gefunden")
            self._claude_pfad = None
            return None
        except Exception as e:
            logger.error(f"claude CLI unerwarteter Fehler ({agent_name}): {e}")
            return None

    def _rate_limit_warten(self):
        """Wartet bei Bedarf um Rate-Limit einzuhalten."""
        jetzt = time.time()
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
        if agent_name not in self._token_verbrauch:
            self._token_verbrauch[agent_name] = {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "anfragen": 0,
            }
        self._token_verbrauch[agent_name]["prompt_tokens"] += prompt_tokens
        self._token_verbrauch[agent_name]["completion_tokens"] += completion_tokens
        self._token_verbrauch[agent_name]["anfragen"] += 1

    def token_verbrauch_heute(self) -> dict:
        return dict(self._token_verbrauch)
