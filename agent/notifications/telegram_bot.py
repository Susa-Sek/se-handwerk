"""Telegram-Benachrichtigungen für den Akquise-Agent."""

import asyncio
import os
from typing import Optional

from telegram import Bot
from telegram.constants import ParseMode

from models import Bewertungsergebnis
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.telegram")


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
            f"Score: {e.score_gesamt}/100 | {e.kategorie.value} | {e.listing.quelle.value}\n"
            f"Ort: {e.listing.ort or '-'}\n"
            f"<a href=\"{e.listing.url}\">Anzeige öffnen</a>\n"
        )
        if e.antwort_vorschlag:
            text += f"\n--- Vorschlag ---\n{e.antwort_vorschlag[:500]}"
        return text

    async def _senden_async(self, ergebnis: Bewertungsergebnis) -> bool:
        if not self.bot or not self.chat_id:
            logger.warning("Telegram: Bot oder Chat-ID nicht konfiguriert")
            return False
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

    def senden_sync(self, ergebnis: Bewertungsergebnis) -> bool:
        return asyncio.run(self._senden_async(ergebnis))

    async def fehler_melden(self, nachricht: str) -> bool:
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
        return asyncio.run(self._zusammenfassung_async(statistik, top))
