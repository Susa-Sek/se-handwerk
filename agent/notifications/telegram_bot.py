"""Telegram-Benachrichtigungen für den Akquise-Agent."""

import os
import requests
from typing import Optional

from models import Bewertungsergebnis
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.telegram")


class TelegramNotifier:
    def __init__(self, config: dict):
        self.config = config
        token = os.getenv("TELEGRAM_BOT_TOKEN") or config.get("telegram", {}).get("bot_token")
        chat_id = os.getenv("TELEGRAM_CHAT_ID") or config.get("telegram", {}).get("chat_id")
        self.token = token
        self.chat_id = str(chat_id) if chat_id else None
        self.api_url = f"https://api.telegram.org/bot{token}" if token else None

    def _send_message(self, text: str) -> bool:
        """Sendet eine Nachricht über die Telegram API."""
        if not self.token or not self.chat_id:
            logger.warning("Telegram: Bot-Token oder Chat-ID nicht konfiguriert")
            return False
        try:
            response = requests.post(
                f"{self.api_url}/sendMessage",
                data={
                    "chat_id": self.chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
                timeout=10,
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    def _format_nachricht(self, ergebnis: Bewertungsergebnis) -> str:
        e = ergebnis
        prioritaet_emoji = {"gruen": "🟢", "gelb": "🟡", "rot": "🔴"}.get(e.prioritaet.value, "⚪")
        text = (
            f"{prioritaet_emoji} <b>{e.listing.titel[:80]}</b>\n"
            f"📊 Score: {e.score_gesamt}/100 "
            f"(Region: {e.score_region} | Leistung: {e.score_leistung} | Qualität: {e.score_qualitaet})\n"
            f"📍 Ort: {e.listing.ort or '-'}\n"
            f"📁 Kategorie: {e.kategorie.value} | Quelle: {e.listing.quelle.value}\n"
            f"<a href=\"{e.listing.url}\">🔗 Anzeige öffnen</a>\n"
        )
        # KI-Begründung anzeigen
        if e.ki_begruendung:
            text += f"\n💡 <b>KI-Bewertung:</b> {e.ki_begruendung[:300]}"
        # Antwort-Vorschlag anzeigen
        if e.antwort_vorschlag:
            text += f"\n\n📝 <b>Antwort-Vorschlag:</b>\n{e.antwort_vorschlag[:400]}"
        return text

    def senden_sync(self, ergebnis: Bewertungsergebnis) -> bool:
        """Sendet Telegram-Nachricht synchron via HTTP API."""
        if not self._send_message(self._format_nachricht(ergebnis)):
            return False
        logger.info(f"Telegram: Nachricht gesendet für '{ergebnis.listing.titel[:50]}'")
        return True

    def fehler_melden(self, nachricht: str) -> bool:
        """Sendet eine Fehlermeldung."""
        return self._send_message(f"⚠️ <b>Agent-Fehler</b>\n\n{nachricht}")

    def _format_zusammenfassung(self, statistik: dict, top: list) -> str:
        lines = [
            "📊 <b>Tages-Zusammenfassung</b>",
            f"Gesamt: {statistik.get('gesamt', 0)} | 🟢 {statistik.get('gruen', 0)} | 🟡 {statistik.get('gelb', 0)} | 🔴 {statistik.get('rot', 0)}",
            "",
        ]
        for i, row in enumerate(top, 1):
            lines.append(f"{i}. [{row.get('prioritaet', '?')}] {row.get('titel', '')[:50]} | {row.get('ort', '')}")
        return "\n".join(lines)

    def zusammenfassung_sync(self, statistik: dict, top: list) -> bool:
        """Sendet eine Tageszusammenfassung."""
        return self._send_message(self._format_zusammenfassung(statistik, top))

    def send_strategie(self, text: str) -> bool:
        """Sendet eine Strategie-Nachricht."""
        return self._send_message(text)