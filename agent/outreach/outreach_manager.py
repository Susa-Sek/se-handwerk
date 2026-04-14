"""Orchestriert den E-Mail-Outreach-Workflow."""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from models import Bewertungsergebnis, EmailKontakt, KontaktStatus
from utils.logger import setup_logger

if TYPE_CHECKING:
    from database import Database
    from ki.outreach_agent import OutreachAgent
    from notifications.telegram_bot import TelegramNotifier
    from outreach.imap_client import IMAPClient
    from outreach.kontakt_extraktor import KontaktExtraktor
    from outreach.smtp_client import SMTPClient

logger = setup_logger("se_handwerk.outreach.manager")


class OutreachManager:
    """Steuert E-Mail-Extraktion, Telegram-Freigabe, Versand und Follow-ups."""

    def __init__(
        self,
        config: dict,
        db: "Database",
        imap_client: "IMAPClient",
        smtp_client: "SMTPClient",
        kontakt_extraktor: "KontaktExtraktor",
        outreach_agent: "OutreachAgent",
        telegram: "TelegramNotifier",
    ):
        self._config = config
        self._db = db
        self._imap = imap_client
        self._smtp = smtp_client
        self._extraktor = kontakt_extraktor
        self._outreach_agent = outreach_agent
        self._telegram = telegram

        follow_up_tage = config.get("email", {}).get("follow_up_tage", [3, 7])
        self._follow_up_1_tage = follow_up_tage[0] if len(follow_up_tage) > 0 else 3
        self._follow_up_2_abstand = (
            follow_up_tage[1] - follow_up_tage[0]
            if len(follow_up_tage) > 1
            else 4
        )

    def outreach_starten(self, ergebnis: Bewertungsergebnis) -> None:
        """Prüft ob Outreach möglich ist und stellt Freigabe-Anfrage per Telegram."""
        email = self._extraktor.extrahieren(ergebnis.listing)
        if not email:
            return

        if self._db.email_bereits_kontaktiert(email):
            logger.debug(f"Bereits kontaktiert (DB): {email}")
            return

        if self._imap.bereits_kontaktiert(email):
            logger.info(f"Bereits kontaktiert (IMAP): {email}")
            return

        betreff, text = self._outreach_agent.email_erstellen(ergebnis)

        kontakt = EmailKontakt(
            listing_url_hash=ergebnis.listing.url_hash,
            empfaenger_email=email,
            betreff=betreff,
            nachricht_text=text,
        )
        kontakt_id = self._db.email_kontakt_speichern(kontakt)
        if kontakt_id is None:
            # INSERT OR IGNORE: E-Mail war bereits in DB → überspringen
            return

        self._telegram.outreach_freigabe_anfragen(
            kontakt_id=kontakt_id,
            empfaenger=email,
            betreff=betreff,
            vorschau=text[:200],
        )
        logger.info(f"Freigabe-Anfrage gesendet für: {email} (id={kontakt_id})")

    def genehmigte_senden(self) -> None:
        """Verarbeitet Telegram-Callbacks und sendet genehmigte E-Mails."""
        # Telegram-Callbacks abrufen und Status in DB aktualisieren
        callbacks = self._telegram.callbacks_verarbeiten(self._db)
        for cb in callbacks:
            status = "genehmigt" if cb["genehmigt"] else "abgelehnt"
            self._db.email_kontakt_status_setzen(cb["id"], status)
            aktion = "freigegeben" if cb["genehmigt"] else "abgelehnt"
            logger.info(f"Kontakt {cb['id']} per Telegram {aktion}")

        # Alle genehmigten Kontakte senden
        for kontakt in self._db.email_kontakte_laden("genehmigt"):
            gesendet = self._smtp.senden(
                empfaenger=kontakt["empfaenger_email"],
                betreff=kontakt["betreff"],
                text=kontakt["nachricht_text"],
            )
            if gesendet:
                self._db.email_kontakt_status_setzen(
                    kontakt["id"], "gesendet", gesendet_am=datetime.now()
                )

    def follow_ups_pruefen(self) -> None:
        """Erkennt Antworten und verschickt fällige Follow-up-E-Mails."""
        # Antworten via IMAP erkennen
        try:
            antworten = self._imap.posteingang_absender_sync()
            for status in ("gesendet", "follow_up_1"):
                for k in self._db.email_kontakte_laden(status):
                    if k["empfaenger_email"] in antworten:
                        self._db.email_kontakt_status_setzen(
                            k["id"], "beantwortet", antwort_erhalten_am=datetime.now()
                        )
                        logger.info(f"Antwort erkannt von: {k['empfaenger_email']}")
        except Exception as e:
            logger.error(f"Fehler bei Antwort-Erkennung: {e}")

        # Follow-up 1 (nach X Tagen ohne Antwort)
        grenze_1 = datetime.now() - timedelta(days=self._follow_up_1_tage)
        for k in self._db.email_kontakte_laden("gesendet"):
            if k.get("gesendet_am") and k["gesendet_am"] < grenze_1:
                betreff = f"Nochmals: {k['betreff']}"
                text = self._follow_up_text(k, 1)
                if self._smtp.senden(k["empfaenger_email"], betreff, text):
                    self._db.email_kontakt_status_setzen(
                        k["id"], "follow_up_1", follow_up_1_am=datetime.now()
                    )

        # Follow-up 2 (weiterer Abstand nach Follow-up 1)
        grenze_2 = datetime.now() - timedelta(days=self._follow_up_2_abstand)
        for k in self._db.email_kontakte_laden("follow_up_1"):
            if k.get("follow_up_1_am") and k["follow_up_1_am"] < grenze_2:
                titel = k.get("titel") or k.get("betreff", "Ihre Anfrage")
                betreff = f"Letzte Nachfrage: {titel[:50]}"
                text = self._follow_up_text(k, 2)
                if self._smtp.senden(k["empfaenger_email"], betreff, text):
                    self._db.email_kontakt_status_setzen(
                        k["id"], "follow_up_2", follow_up_2_am=datetime.now()
                    )

    def _follow_up_text(self, kontakt: dict, nummer: int) -> str:
        """Erstellt Template-basierten Follow-up-Text."""
        titel = kontakt.get("titel") or kontakt.get("betreff", "Ihre Anfrage")
        titel = titel[:80]
        if nummer == 1:
            return (
                f"Guten Tag,\n\n"
                f"wir hatten Ihnen vor einigen Tagen bezüglich Ihrer Anfrage "
                f"\u201e{titel}\u201c geschrieben und möchten kurz nachfragen, "
                f"ob noch Interesse besteht.\n\n"
                f"Gern stehen wir für Fragen oder einen Terminvorschlag zur Verfügung.\n\n"
                f"Mit freundlichen Grüßen\nSE Handwerk\nkontakt@sehandwerk.de"
            )
        return (
            f"Guten Tag,\n\n"
            f"dies ist unsere letzte Nachfrage zu Ihrer Anfrage \u201e{titel}\u201c.\n"
            f"Falls Sie weiterhin Unterstützung benötigen, melden Sie sich gern jederzeit.\n\n"
            f"Mit freundlichen Grüßen\nSE Handwerk\nkontakt@sehandwerk.de"
        )
