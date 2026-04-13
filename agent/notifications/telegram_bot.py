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

    def outreach_freigabe_anfragen(
        self,
        kontakt_id: int,
        empfaenger: str,
        betreff: str,
        vorschau: str,
    ) -> bool:
        """Sendet Freigabe-Anfrage mit Inline-Keyboard (✅/❌) via Telegram."""
        if not self.token or not self.chat_id:
            logger.warning("Telegram: nicht konfiguriert – Freigabe-Anfrage übersprungen")
            return False

        keyboard = {
            "inline_keyboard": [[
                {"text": "✅ Freigeben", "callback_data": f"oja:{kontakt_id}"},
                {"text": "❌ Ablehnen",  "callback_data": f"onein:{kontakt_id}"},
            ]]
        }
        text = (
            f"📧 <b>E-Mail-Freigabe</b>\n"
            f"An: <code>{empfaenger}</code>\n"
            f"Betreff: {betreff[:60]}\n\n"
            f"<i>{vorschau[:200]}…</i>"
        )
        try:
            r = requests.post(
                f"{self.api_url}/sendMessage",
                json={
                    "chat_id": self.chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "reply_markup": keyboard,
                },
                timeout=10,
            )
            if r.ok:
                logger.info(f"Freigabe-Anfrage gesendet für Kontakt {kontakt_id}")
            return r.ok
        except Exception as e:
            logger.error(f"Freigabe-Anfrage Fehler: {e}")
            return False

    def callbacks_verarbeiten(self, db) -> list[dict]:
        """Pollt getUpdates, verarbeitet oja:/onein: Callback-Queries.

        Speichert den Update-Offset persistent in der DB (einstellungen-Tabelle).
        Gibt Liste von {id: int, genehmigt: bool} zurück.
        """
        if not self.token or not self.chat_id:
            return []

        offset = int(db.setting_lesen("telegram_update_offset") or 0)
        try:
            r = requests.get(
                f"{self.api_url}/getUpdates",
                params={
                    "offset": offset,
                    "timeout": 0,
                    "allowed_updates": ["callback_query"],
                },
                timeout=15,
            )
            if not r.ok:
                logger.warning(f"getUpdates fehlgeschlagen: {r.status_code}")
                return []
        except Exception as e:
            logger.error(f"getUpdates Fehler: {e}")
            return []

        ergebnisse = []
        for update in r.json().get("result", []):
            update_id = update["update_id"]
            db.setting_setzen("telegram_update_offset", str(update_id + 1))

            cq = update.get("callback_query")
            if not cq:
                continue

            # Callback bestätigen (verhindert Ladeanzeige im Client)
            try:
                requests.post(
                    f"{self.api_url}/answerCallbackQuery",
                    json={"callback_query_id": cq["id"]},
                    timeout=5,
                )
            except Exception:
                pass

            data = cq.get("data", "")
            if data.startswith("oja:"):
                try:
                    ergebnisse.append({"id": int(data.split(":")[1]), "genehmigt": True})
                except (ValueError, IndexError):
                    pass
            elif data.startswith("onein:"):
                try:
                    ergebnisse.append({"id": int(data.split(":")[1]), "genehmigt": False})
                except (ValueError, IndexError):
                    pass

        if ergebnisse:
            logger.info(f"Telegram-Callbacks verarbeitet: {len(ergebnisse)} Entscheidungen")
        return ergebnisse