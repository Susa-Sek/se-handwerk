"""Telegram-Benachrichtigungen für den Akquise-Agent."""

import asyncio
import os
import threading
from typing import Optional

from telegram import Bot
from telegram.constants import ParseMode

from models import Bewertungsergebnis
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.telegram")


def _run_async(coro):
    """Führt async Funktion in separatem Thread aus."""
    result = [None]
    exception = [None]

    def _run():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result[0] = loop.run_until_complete(coro)
            finally:
                loop.close()
        except Exception as e:
            exception[0] = e

    thread = threading.Thread(target=_run)
    thread.start()
    thread.join(timeout=15)

    if exception[0]:
        raise exception[0]
    return result[0]


class TelegramNotifier:
    def __init__(self, config: dict):
        self.config = config
        token = os.getenv("TELEGRAM_BOT_TOKEN") or config.get("telegram", {}).get("bot_token")
        chat_id = os.getenv("TELEGRAM_CHAT_ID") or config.get("telegram", {}).get("chat_id")
        self.bot = Bot(token=token) if token else None
        self.chat_id = str(chat_id) if chat_id else None

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
        """Sendet Telegram-Nachricht."""
        if not self.bot or not self.chat_id:
            logger.warning("Telegram: Bot oder Chat-ID nicht konfiguriert")
            return False
        try:
            _run_async(self._senden_async(ergebnis))
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    async def _senden_async(self, ergebnis: Bewertungsergebnis) -> bool:
        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=self._format_nachricht(ergebnis),
                parse_mode=ParseMode.HTML,
                disable_web_page_preview=True,
            )
            logger.info(f"Telegram: Nachricht gesendet für '{ergebnis.listing.titel[:50]}'")
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    async def _fehler_melden_async(self, nachricht: str) -> bool:
        if not self.bot or not self.chat_id:
            return False
        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=f"⚠️ <b>Agent-Fehler</b>\n\n{nachricht}",
                parse_mode=ParseMode.HTML,
            )
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    def fehler_melden(self, nachricht: str) -> bool:
        try:
            return _run_async(self._fehler_melden_async(nachricht)) or False
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    def _format_zusammenfassung(self, statistik: dict, top: list) -> str:
        lines = [
            "📊 <b>Tages-Zusammenfassung</b>",
            f"Gesamt: {statistik.get('gesamt', 0)} | 🟢 {statistik.get('gruen', 0)} | 🟡 {statistik.get('gelb', 0)} | 🔴 {statistik.get('rot', 0)}",
            "",
        ]
        for i, row in enumerate(top, 1):
            lines.append(f"{i}. [{row.get('prioritaet', '?')}] {row.get('titel', '')[:50]} | {row.get('ort', '')}")
        return "\n".join(lines)

    async def _zusammenfassung_async(self, statistik: dict, top: list) -> bool:
        if not self.bot or not self.chat_id:
            return False
        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=self._format_zusammenfassung(statistik, top),
                parse_mode=ParseMode.HTML,
            )
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    def zusammenfassung_sync(self, statistik: dict, top: list) -> bool:
        try:
            return _run_async(self._zusammenfassung_async(statistik, top)) or False
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False