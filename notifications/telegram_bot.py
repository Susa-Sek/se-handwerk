"""Telegram Bot für Benachrichtigungen über neue Aufträge."""

import asyncio
import os
from typing import Optional

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    ContextTypes,
)

from models import Bewertungsergebnis, Prioritaet
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.telegram")


class TelegramNotifier:
    """Sendet Auftrags-Benachrichtigungen per Telegram."""

    def __init__(self, config: dict):
        self.config = config
        self.token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID", "")
        self.bot: Optional[Bot] = None
        self._app: Optional[Application] = None
        self._callback_handler: Optional[callable] = None

        if not self.token or self.token == "DEIN_BOT_TOKEN_HIER":
            logger.warning("Telegram Bot Token nicht konfiguriert!")
        else:
            self.bot = Bot(token=self.token)

    def set_callback_handler(self, handler: callable):
        """Setzt den Handler für Button-Callbacks."""
        self._callback_handler = handler

    async def senden(self, ergebnis: Bewertungsergebnis) -> bool:
        """Sendet eine Benachrichtigung für ein bewertetes Listing."""
        if not self.bot:
            logger.error("Telegram Bot nicht initialisiert")
            return False

        nachricht = self._formatiere_nachricht(ergebnis)
        keyboard = self._erstelle_keyboard(ergebnis)

        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=nachricht,
                parse_mode="HTML",
                reply_markup=keyboard,
                disable_web_page_preview=False,
            )
            logger.info(
                f"Telegram: Nachricht gesendet für '{ergebnis.listing.titel[:40]}'"
            )
            return True
        except Exception as e:
            logger.error(f"Telegram Fehler: {e}")
            return False

    async def tages_zusammenfassung(self, statistik: dict, top_listings: list[dict]):
        """Sendet die tägliche Zusammenfassung."""
        if not self.bot:
            return

        text = (
            "<b>📊 Tages-Zusammenfassung SE Handwerk</b>\n"
            "━━━━━━━━━━━━━━━━━━━\n\n"
            f"📋 Gefunden: <b>{statistik['gesamt']}</b> Listings\n"
            f"🟢 Hoch: <b>{statistik['gruen']}</b>\n"
            f"🟡 Mittel: <b>{statistik['gelb']}</b>\n"
            f"🔴 Niedrig: <b>{statistik['rot']}</b>\n"
            f"✅ Beantwortet: <b>{statistik['beantwortet']}</b>\n"
        )

        if top_listings:
            text += "\n<b>🏆 Top 3 Aufträge heute:</b>\n"
            for i, listing in enumerate(top_listings, 1):
                emoji = ["🥇", "🥈", "🥉"][i - 1] if i <= 3 else "•"
                text += (
                    f"\n{emoji} <b>{listing['titel'][:50]}</b>\n"
                    f"   📍 {listing['ort']} | Score: {listing['score']}\n"
                    f"   🔗 {listing['url']}\n"
                )

        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=text,
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            logger.info("Tages-Zusammenfassung gesendet")
        except Exception as e:
            logger.error(f"Fehler bei Tages-Zusammenfassung: {e}")

    async def fehler_melden(self, nachricht: str):
        """Sendet eine Fehlermeldung an den Admin."""
        if not self.bot:
            return

        text = f"⚠️ <b>SE Handwerk Agent - Fehler</b>\n\n{nachricht}"

        try:
            await self.bot.send_message(
                chat_id=self.chat_id,
                text=text,
                parse_mode="HTML",
            )
        except Exception as e:
            logger.error(f"Konnte Fehlermeldung nicht senden: {e}")

    def _formatiere_nachricht(self, ergebnis: Bewertungsergebnis) -> str:
        """Formatiert die Benachrichtigung."""
        listing = ergebnis.listing

        # Prioritäts-Emoji
        prio_map = {
            Prioritaet.GRUEN: "🟢",
            Prioritaet.GELB: "🟡",
            Prioritaet.ROT: "🔴",
        }
        prio_emoji = prio_map.get(ergebnis.prioritaet, "⚪")

        # Kategorie-Label
        kat_labels = {
            "boden": "Bodenarbeiten",
            "montage": "Montage",
            "uebergabe": "Übergabe/Renovierung",
            "sonstiges": "Sonstiges",
        }
        kat_label = kat_labels.get(ergebnis.kategorie.value, "Sonstiges")

        # Quelle
        quelle_labels = {
            "kleinanzeigen": "Kleinanzeigen",
            "myhammer": "MyHammer",
            "google": "Google",
            "facebook": "Facebook",
        }
        quelle = quelle_labels.get(listing.quelle.value, listing.quelle.value)

        text = (
            f"{prio_emoji} <b>NEUER AUFTRAG</b> (Score: {ergebnis.score_gesamt}/100)\n"
            f"━━━━━━━━━━━━━━━━━━━\n\n"
            f"📋 <b>{listing.titel}</b>\n"
            f"📍 {listing.ort}\n"
            f"🏷️ {kat_label}\n"
            f"🔗 {listing.url}\n"
        )

        if listing.preis:
            text += f"💶 {listing.preis}\n"

        text += (
            f"\n📊 Score: {ergebnis.score_region}R + "
            f"{ergebnis.score_leistung}L + {ergebnis.score_qualitaet}Q\n"
            f"📅 {listing.datum_gefunden.strftime('%d.%m.%Y, %H:%M')} "
            f"| Quelle: {quelle}\n"
        )

        if listing.beschreibung:
            # Beschreibung auf max 200 Zeichen kürzen
            beschr = listing.beschreibung[:200]
            if len(listing.beschreibung) > 200:
                beschr += "..."
            text += f"\n📝 <i>{beschr}</i>\n"

        if ergebnis.antwort_vorschlag:
            text += (
                f"\n💬 <b>Vorgeschlagene Antwort:</b>\n"
                f"<code>{ergebnis.antwort_vorschlag}</code>\n"
            )

        return text

    def _erstelle_keyboard(
        self, ergebnis: Bewertungsergebnis
    ) -> InlineKeyboardMarkup:
        """Erstellt Inline-Buttons unter der Nachricht."""
        url_hash = ergebnis.listing.url_hash

        buttons = [
            [
                InlineKeyboardButton(
                    "✅ Antwort kopieren",
                    callback_data=f"copy:{url_hash}",
                ),
                InlineKeyboardButton(
                    "📋 Details",
                    callback_data=f"details:{url_hash}",
                ),
            ],
            [
                InlineKeyboardButton(
                    "❌ Überspringen",
                    callback_data=f"skip:{url_hash}",
                ),
                InlineKeyboardButton(
                    "🔗 Öffnen",
                    url=ergebnis.listing.url,
                ),
            ],
        ]

        return InlineKeyboardMarkup(buttons)

    def senden_sync(self, ergebnis: Bewertungsergebnis) -> bool:
        """Synchroner Wrapper für senden()."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Wenn bereits ein Event-Loop läuft
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(
                        asyncio.run, self.senden(ergebnis)
                    ).result()
            else:
                return loop.run_until_complete(self.senden(ergebnis))
        except RuntimeError:
            return asyncio.run(self.senden(ergebnis))

    def zusammenfassung_sync(self, statistik: dict, top_listings: list[dict]):
        """Synchroner Wrapper für tages_zusammenfassung()."""
        try:
            asyncio.run(self.tages_zusammenfassung(statistik, top_listings))
        except RuntimeError:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(
                self.tages_zusammenfassung(statistik, top_listings)
            )
            loop.close()
