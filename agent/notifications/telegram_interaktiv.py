"""Bidirektionaler Telegram-Bot mit Inline-Keyboards für Entscheidungen."""

import asyncio
import json
import os
import threading
from datetime import datetime
from typing import Optional

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

from database import Database
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.telegram_interaktiv")


class TelegramInteraktiv:
    """Bidirektionaler Telegram-Bot mit Inline-Keyboards.

    Läuft als Background-Daemon-Thread mit eigenem asyncio Event-Loop.
    Bietet Commands und Callback-Handler für Genehmigen/Ablehnen.
    """

    def __init__(self, config: dict, db: Database):
        self.config = config
        self.db = db
        self._token = os.getenv("TELEGRAM_BOT_TOKEN") or config.get("telegram", {}).get("bot_token")
        self._chat_id = os.getenv("TELEGRAM_CHAT_ID") or config.get("telegram", {}).get("chat_id")
        self._chat_id = str(self._chat_id) if self._chat_id else None
        self._bot: Optional[Bot] = None
        self._app: Optional[Application] = None
        self._thread: Optional[threading.Thread] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._pausiert = False

        # Callback für genehmigte Entscheidungen (wird von main.py gesetzt)
        self.on_entscheidung: Optional[callable] = None

    @property
    def ist_konfiguriert(self) -> bool:
        return bool(self._token and self._chat_id)

    def starten(self):
        """Startet den interaktiven Bot als Background-Thread."""
        if not self.ist_konfiguriert:
            logger.warning("Telegram interaktiv: Token oder Chat-ID fehlt")
            return

        self._thread = threading.Thread(target=self._run_bot, daemon=True)
        self._thread.start()
        logger.info("Telegram interaktiver Bot gestartet (Background-Thread)")

    def _run_bot(self):
        """Startet den Bot in einem eigenen asyncio Event-Loop."""
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._loop.run_until_complete(self._start_polling())

    async def _start_polling(self):
        """Konfiguriert und startet das Polling."""
        self._app = Application.builder().token(self._token).build()
        self._bot = self._app.bot

        # Commands registrieren
        self._app.add_handler(CommandHandler("status", self._cmd_status))
        self._app.add_handler(CommandHandler("plattformen", self._cmd_plattformen))
        self._app.add_handler(CommandHandler("metriken", self._cmd_metriken))
        self._app.add_handler(CommandHandler("hilfe", self._cmd_hilfe))
        self._app.add_handler(CommandHandler("pause", self._cmd_pause))
        self._app.add_handler(CommandHandler("weiter", self._cmd_weiter))

        # Callback-Handler für Inline-Buttons
        self._app.add_handler(CallbackQueryHandler(self._button_handler))

        logger.info("Telegram-Polling gestartet")
        await self._app.initialize()
        await self._app.start()
        await self._app.updater.start_polling(drop_pending_updates=True)

        # Blockiert bis stop
        stop_event = asyncio.Event()
        await stop_event.wait()

    def stoppen(self):
        """Stoppt den Bot."""
        if self._app and self._loop:
            asyncio.run_coroutine_threadsafe(self._shutdown(), self._loop)

    async def _shutdown(self):
        """Fährt den Bot herunter."""
        if self._app:
            await self._app.updater.stop()
            await self._app.stop()
            await self._app.shutdown()

    # ----------------------------------------------------------------
    # Senden: Entscheidungen mit Inline-Keyboards
    # ----------------------------------------------------------------

    def entscheidung_senden(self, entscheidung_id: int, titel: str, beschreibung: str) -> Optional[int]:
        """Sendet eine Entscheidung mit Genehmigen/Ablehnen-Buttons.

        Returns:
            Telegram message_id oder None bei Fehler.
        """
        if not self.ist_konfiguriert:
            return None

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton(
                    "Genehmigen",
                    callback_data=json.dumps({"a": "g", "id": entscheidung_id}),
                ),
                InlineKeyboardButton(
                    "Ablehnen",
                    callback_data=json.dumps({"a": "a", "id": entscheidung_id}),
                ),
            ]
        ])

        text = (
            f"<b>Entscheidung erforderlich</b>\n\n"
            f"<b>{titel}</b>\n"
            f"{beschreibung[:800]}\n\n"
            f"<i>Bitte per Button entscheiden:</i>"
        )

        try:
            if self._loop and self._loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    self._senden_async(text, keyboard), self._loop
                )
                return future.result(timeout=10)
            else:
                return asyncio.run(self._senden_async(text, keyboard))
        except Exception as e:
            logger.error(f"Fehler beim Senden der Entscheidung: {e}")
            return None

    async def _senden_async(
        self, text: str, reply_markup=None
    ) -> Optional[int]:
        """Sendet eine Nachricht asynchron und gibt message_id zurück."""
        bot = self._bot or Bot(token=self._token)
        try:
            msg = await bot.send_message(
                chat_id=self._chat_id,
                text=text,
                parse_mode=ParseMode.HTML,
                reply_markup=reply_markup,
                disable_web_page_preview=True,
            )
            return msg.message_id
        except Exception as e:
            logger.error(f"Telegram Sendefehler: {e}")
            return None

    def nachricht_senden(self, text: str) -> Optional[int]:
        """Sendet eine einfache Nachricht (ohne Buttons)."""
        if not self.ist_konfiguriert:
            return None
        try:
            if self._loop and self._loop.is_running():
                future = asyncio.run_coroutine_threadsafe(
                    self._senden_async(text), self._loop
                )
                return future.result(timeout=10)
            else:
                return asyncio.run(self._senden_async(text))
        except Exception as e:
            logger.error(f"Fehler beim Senden: {e}")
            return None

    # ----------------------------------------------------------------
    # Command-Handler
    # ----------------------------------------------------------------

    async def _cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /status – zeigt Agent-Status."""
        statistik = self.db.statistik_heute()
        offene = self.db.entscheidungen_offen()
        plattformen = self.db.plattformen_laden(status="aktiv")

        pause_text = " (PAUSIERT)" if self._pausiert else ""
        text = (
            f"<b>SE Handwerk Agent Status{pause_text}</b>\n\n"
            f"<b>Heute:</b>\n"
            f"  Gesamt: {statistik['gesamt']} Listings\n"
            f"  Gruen: {statistik['gruen']} | Gelb: {statistik['gelb']} | Rot: {statistik['rot']}\n\n"
            f"<b>Offene Entscheidungen:</b> {len(offene)}\n"
            f"<b>Aktive Plattformen:</b> {len(plattformen)}\n"
        )
        await update.message.reply_text(text, parse_mode=ParseMode.HTML)

    async def _cmd_plattformen(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /plattformen – zeigt alle Plattformen."""
        alle = self.db.plattformen_laden()
        if not alle:
            await update.message.reply_text("Keine Plattformen registriert.")
            return

        text = "<b>Plattformen</b>\n\n"
        status_icons = {
            "aktiv": "o",
            "genehmigt": "+",
            "vorgeschlagen": "?",
            "deaktiviert": "x",
            "fehlgeschlagen": "!",
        }
        for p in alle:
            icon = status_icons.get(p["status"], "-")
            rate = f"{p['erfolgsrate']:.0%}" if p["erfolgsrate"] else "0%"
            text += (
                f"[{icon}] <b>{p['name']}</b> ({p['status']})\n"
                f"    {p['basis_url']}\n"
                f"    Listings: {p['gesamt_listings']} | Erfolg: {rate}\n\n"
            )
        await update.message.reply_text(text, parse_mode=ParseMode.HTML)

    async def _cmd_metriken(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /metriken – zeigt Erfolgsmetriken."""
        zusammenfassung = self.db.metriken_zusammenfassung(tage=7)
        scrape_stats = self.db.scrape_log_statistik(tage=7)

        text = "<b>Metriken (letzte 7 Tage)</b>\n\n"

        if scrape_stats:
            text += "<b>Scrape-Statistik:</b>\n"
            for s in scrape_stats[:5]:
                text += (
                    f"  {s['plattform_name']}: {s['ergebnisse_gesamt'] or 0} Ergebnisse, "
                    f"{s['relevante_gesamt'] or 0} relevant, {s['fehler'] or 0} Fehler\n"
                )
            text += "\n"

        if zusammenfassung.get("suchbegriffe"):
            text += "<b>Top-Suchbegriffe:</b>\n"
            for s in zusammenfassung["suchbegriffe"][:5]:
                text += f"  {s['schluessel']}: {s['gesamt']} / {s['relevant']} relevant\n"
            text += "\n"

        if zusammenfassung.get("plattformen"):
            text += "<b>Plattform-Metriken:</b>\n"
            for p in zusammenfassung["plattformen"][:5]:
                text += f"  {p['schluessel']}: {p['gesamt']} / {p['relevant']} relevant\n"

        if not scrape_stats and not zusammenfassung.get("suchbegriffe"):
            text += "Noch keine Metriken vorhanden."

        await update.message.reply_text(text, parse_mode=ParseMode.HTML)

    async def _cmd_hilfe(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /hilfe – zeigt verfügbare Commands."""
        text = (
            "<b>SE Handwerk Agent - Befehle</b>\n\n"
            "/status – Agent-Status und Tagesstatistik\n"
            "/plattformen – Alle registrierten Plattformen\n"
            "/metriken – Erfolgsmetriken der letzten 7 Tage\n"
            "/pause – Agent pausieren\n"
            "/weiter – Agent fortsetzen\n"
            "/hilfe – Diese Hilfe anzeigen"
        )
        await update.message.reply_text(text, parse_mode=ParseMode.HTML)

    async def _cmd_pause(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /pause – pausiert den Agenten."""
        self._pausiert = True
        await update.message.reply_text("Agent pausiert. /weiter zum Fortsetzen.")
        logger.info("Agent via Telegram pausiert")

    async def _cmd_weiter(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler für /weiter – setzt den Agenten fort."""
        self._pausiert = False
        await update.message.reply_text("Agent fortgesetzt.")
        logger.info("Agent via Telegram fortgesetzt")

    @property
    def ist_pausiert(self) -> bool:
        return self._pausiert

    # ----------------------------------------------------------------
    # Callback-Handler für Inline-Buttons
    # ----------------------------------------------------------------

    async def _button_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Verarbeitet Button-Klicks (Genehmigen/Ablehnen)."""
        query = update.callback_query
        await query.answer()

        try:
            daten = json.loads(query.data)
            aktion = daten.get("a")
            entscheidung_id = daten.get("id")
        except (json.JSONDecodeError, KeyError):
            await query.edit_message_text("Fehler: Ungültige Button-Daten.")
            return

        if not entscheidung_id:
            return

        entscheidung = self.db.entscheidung_laden(entscheidung_id)
        if not entscheidung:
            await query.edit_message_text("Entscheidung nicht gefunden.")
            return

        if entscheidung["status"] != "offen":
            await query.edit_message_text(
                f"Entscheidung bereits verarbeitet (Status: {entscheidung['status']})."
            )
            return

        if aktion == "g":
            neuer_status = "genehmigt"
            status_text = "GENEHMIGT"
        elif aktion == "a":
            neuer_status = "abgelehnt"
            status_text = "ABGELEHNT"
        else:
            return

        self.db.entscheidung_aktualisieren(entscheidung_id, neuer_status)
        self.db.aktion_loggen(
            agent_name="telegram",
            aktion=f"entscheidung_{neuer_status}",
            details=f"Entscheidung #{entscheidung_id}: {entscheidung['titel']}",
        )

        await query.edit_message_text(
            f"<b>{status_text}</b>\n\n"
            f"{entscheidung['titel']}\n\n"
            f"<i>Entschieden: {datetime.now().strftime('%d.%m.%Y %H:%M')}</i>",
            parse_mode=ParseMode.HTML,
        )
        logger.info(f"Entscheidung #{entscheidung_id} → {neuer_status}")

        # Callback auslösen falls registriert
        if neuer_status == "genehmigt" and self.on_entscheidung:
            try:
                self.on_entscheidung(entscheidung_id, entscheidung)
            except Exception as e:
                logger.error(f"Fehler im Entscheidung-Callback: {e}")
