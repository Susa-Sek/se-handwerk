"""B2B-Outreach-Manager: Orchestriert Recherche, Freigabe und Follow-ups."""

from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from models import B2BKontakt, B2BKontaktTyp, KontaktStatus
from utils.logger import setup_logger

if TYPE_CHECKING:
    from database import Database
    from ki.b2b_agent import B2BAgent
    from notifications.telegram_bot import TelegramNotifier
    from outreach.imap_client import IMAPClient
    from outreach.smtp_client import SMTPClient
    from scrapers.b2b_recherche import B2BRecherche

logger = setup_logger("se_handwerk.b2b.manager")


class B2BManager:
    """
    Steuert den vollständigen B2B-Akquise-Zyklus:

    1. recherche_ausfuehren()  — Gelbe Seiten + Google → Impressum → neue Kontakte
    2. genehmigte_senden()     — Telegram-Callbacks → SMTP-Versand
    3. follow_ups_pruefen()    — Antworten erkennen, Follow-up 1+2 versenden
    """

    def __init__(
        self,
        config: dict,
        db: "Database",
        recherche: "B2BRecherche",
        b2b_agent: "B2BAgent",
        smtp: "SMTPClient",
        imap: "IMAPClient",
        telegram: "TelegramNotifier",
    ):
        self._config  = config
        self._db      = db
        self._recherche = recherche
        self._agent   = b2b_agent
        self._smtp    = smtp
        self._imap    = imap
        self._telegram = telegram

        b2b = config.get("b2b", {})
        fu_tage = b2b.get("follow_up_tage", [5, 12])
        self._fu1_tage      = fu_tage[0] if len(fu_tage) > 0 else 5
        self._fu2_abstand   = (fu_tage[1] - fu_tage[0]) if len(fu_tage) > 1 else 7
        self._max_pro_tag   = b2b.get("max_freigaben_pro_tag", 10)
        self._regionen      = b2b.get("regionen", ["Heilbronn"])
        self._typen_cfg     = b2b.get("typen", None)   # None = alle

    # ── 1. Recherche ──────────────────────────────────────────────────────────

    def recherche_ausfuehren(self) -> int:
        """
        Sucht neue B2B-Kontakte und stellt Freigabe-Anfragen per Telegram.
        Gibt Anzahl neuer (noch nicht bekannter) Kontakte zurück.
        """
        # Aktive Typen aus Config laden
        typen = None
        if self._typen_cfg:
            try:
                typen = [B2BKontaktTyp(t) for t in self._typen_cfg]
            except ValueError as e:
                logger.warning(f"Unbekannter B2B-Typ in Config: {e}")

        kontakte = self._recherche.recherchieren(self._regionen, typen)
        neue = 0
        freigaben_heute = 0

        for kontakt in kontakte:
            if freigaben_heute >= self._max_pro_tag:
                logger.info(f"Tageslimit ({self._max_pro_tag}) erreicht — Rest verschoben")
                break

            # Doppelkontaktierung verhindern
            if self._db.b2b_bereits_gespeichert(kontakt.email):
                continue
            if self._imap.bereits_kontaktiert(kontakt.email):
                logger.debug(f"IMAP: bereits kontaktiert {kontakt.email}")
                continue

            # E-Mail generieren
            betreff, text = self._agent.email_erstellen(kontakt)
            kontakt.status = KontaktStatus.AUSSTEHEND

            kontakt_id = self._db.b2b_kontakt_speichern(kontakt)
            if kontakt_id is None:
                continue    # race condition / Duplikat

            # Telegram-Freigabe anfragen (Inline-Keyboard ✅/❌)
            gesendet = self._telegram.b2b_freigabe_anfragen(
                kontakt_id=kontakt_id,
                firma=kontakt.firma,
                typ=kontakt.typ.value,
                email=kontakt.email,
                betreff=betreff,
                vorschau=text[:200],
            )
            if gesendet:
                # Betreff + Text temporär in einstellungen speichern für späteres Senden
                self._db.setting_setzen(f"b2b_betreff_{kontakt_id}", betreff)
                self._db.setting_setzen(f"b2b_text_{kontakt_id}", text)
                neue += 1
                freigaben_heute += 1

        logger.info(f"B2B-Recherche: {neue} neue Kontakte zur Freigabe vorgelegt")
        return neue

    # ── 2. Genehmigte senden ─────────────────────────────────────────────────

    def genehmigte_senden(self) -> None:
        """
        Verarbeitet Telegram-Callbacks (oja_b2b / onein_b2b) und
        sendet genehmigte B2B-E-Mails.
        """
        callbacks = self._telegram.b2b_callbacks_verarbeiten(self._db)
        for cb in callbacks:
            status = "genehmigt" if cb["genehmigt"] else "abgelehnt"
            self._db.b2b_kontakt_status_setzen(cb["id"], status)
            aktion = "freigegeben" if cb["genehmigt"] else "abgelehnt"
            logger.info(f"B2B-Kontakt {cb['id']} per Telegram {aktion}")

        for kontakt in self._db.b2b_kontakte_laden("genehmigt"):
            kid = kontakt["id"]
            betreff = self._db.setting_lesen(f"b2b_betreff_{kid}") or ""
            text    = self._db.setting_lesen(f"b2b_text_{kid}") or ""

            if not betreff or not text:
                logger.warning(f"B2B-Kontakt {kid}: kein Text in einstellungen – übersprungen")
                continue

            if self._smtp.senden(kontakt["email"], betreff, text):
                self._db.b2b_kontakt_status_setzen(
                    kid, "gesendet", gesendet_am=datetime.now()
                )
                logger.info(f"B2B-E-Mail gesendet: {kontakt['firma']} <{kontakt['email']}>")

    # ── 3. Follow-ups + Antworten ────────────────────────────────────────────

    def follow_ups_pruefen(self) -> None:
        """
        Erkennt Antworten via IMAP und verschickt fällige Follow-up-E-Mails.
        Verarbeitet außerdem "Abmelden"-Antworten (DSGVO Opt-out).
        """
        # Antworten via IMAP erkennen
        try:
            antworten = self._imap.posteingang_absender_sync()
            for status_name in ("gesendet", "follow_up_1"):
                for k in self._db.b2b_kontakte_laden(status_name):
                    if k["email"] in antworten:
                        self._db.b2b_kontakt_status_setzen(
                            k["id"], "beantwortet",
                            antwort_erhalten_am=datetime.now()
                        )
                        logger.info(f"B2B-Antwort erkannt: {k['firma']} <{k['email']}>")
                        self._telegram.b2b_antwort_melden(k["firma"], k["email"], k["typ"])
        except Exception as e:
            logger.error(f"IMAP-Fehler bei B2B-Antwortcheck: {e}")

        # Follow-up 1
        grenze_1 = datetime.now() - timedelta(days=self._fu1_tage)
        for k in self._db.b2b_kontakte_laden("gesendet"):
            if k.get("gesendet_am") and k["gesendet_am"] < grenze_1:
                kontakt = self._kontakt_aus_row(k)
                betreff, text = self._agent.follow_up_erstellen(kontakt, 1)
                if self._smtp.senden(k["email"], betreff, text):
                    self._db.b2b_kontakt_status_setzen(
                        k["id"], "follow_up_1", follow_up_1_am=datetime.now()
                    )
                    logger.info(f"B2B Follow-up 1 gesendet: {k['firma']}")

        # Follow-up 2
        grenze_2 = datetime.now() - timedelta(days=self._fu2_abstand)
        for k in self._db.b2b_kontakte_laden("follow_up_1"):
            if k.get("follow_up_1_am") and k["follow_up_1_am"] < grenze_2:
                kontakt = self._kontakt_aus_row(k)
                betreff, text = self._agent.follow_up_erstellen(kontakt, 2)
                if self._smtp.senden(k["email"], betreff, text):
                    self._db.b2b_kontakt_status_setzen(
                        k["id"], "follow_up_2", follow_up_2_am=datetime.now()
                    )
                    logger.info(f"B2B Follow-up 2 gesendet: {k['firma']}")

    # ── Hilfsmethoden ────────────────────────────────────────────────────────

    def _kontakt_aus_row(self, row: dict) -> B2BKontakt:
        """Rekonstruiert B2BKontakt aus DB-Row für Follow-up-Generierung."""
        try:
            typ = B2BKontaktTyp(row.get("typ", "sonstiges"))
        except ValueError:
            typ = B2BKontaktTyp.SONSTIGES
        return B2BKontakt(
            firma=row.get("firma", ""),
            website=row.get("website", ""),
            email=row.get("email", ""),
            typ=typ,
            ort=row.get("ort", "Heilbronn"),
            telefon=row.get("telefon"),
            id=row.get("id"),
        )

    def tages_zusammenfassung(self) -> str:
        """Gibt Statistik-Text für Telegram zurück."""
        stats = self._db.b2b_statistik()
        return (
            f"📊 <b>B2B-Akquise Übersicht</b>\n"
            f"Gesamt: {stats.get('gesamt', 0)} | "
            f"Ausstehend: {stats.get('ausstehend', 0)} | "
            f"Gesendet: {stats.get('gesendet', 0)} | "
            f"Beantwortet: {stats.get('beantwortet', 0)}"
        )
