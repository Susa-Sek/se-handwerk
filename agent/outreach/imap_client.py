"""IMAP-Client zum Prüfen gesendeter E-Mails und Erkennen von Antworten."""

import imaplib
import os
from datetime import datetime, timedelta
from email import message_from_bytes
from email.header import decode_header
from typing import Optional

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.outreach.imap")


def _header_dekodieren(raw: str) -> str:
    """Dekodiert MIME-encoded E-Mail-Header."""
    try:
        teile = decode_header(raw or "")
        decoded = []
        for teil, encoding in teile:
            if isinstance(teil, bytes):
                decoded.append(teil.decode(encoding or "utf-8", errors="replace"))
            else:
                decoded.append(str(teil))
        return " ".join(decoded)
    except Exception:
        return raw or ""


class IMAPClient:
    """Liest Gesendet-Ordner und Posteingang zur Deduplication und Antwort-Erkennung."""

    def __init__(self, config: dict):
        ec = config.get("email", {})
        self._host = ec.get("imap_host", "")
        self._port = ec.get("imap_port", 993)
        self._user = ec.get("absender", "")
        self._passwort = os.getenv("EMAIL_PASSWORT", "")
        self._gesendet_ordner_namen: list[str] = ec.get(
            "gesendet_ordner_namen", ["Sent", "Gesendet", "[Gmail]/Sent Mail"]
        )
        self._cache_ttl = timedelta(minutes=ec.get("imap_cache_minuten", 30))
        self._cache_gesendet: set[str] = set()
        self._cache_eingang: set[str] = set()
        self._cache_zeitpunkt: Optional[datetime] = None

    def _verbinden(self) -> Optional[imaplib.IMAP4_SSL]:
        """Baut IMAP-Verbindung auf. Gibt None bei Fehler zurück."""
        if not self._host or not self._user or not self._passwort:
            logger.warning("IMAP nicht konfiguriert (host/user/passwort fehlt)")
            return None
        try:
            imap = imaplib.IMAP4_SSL(self._host, self._port)
            imap.login(self._user, self._passwort)
            return imap
        except Exception as e:
            logger.error(f"IMAP-Verbindung fehlgeschlagen: {e}")
            return None

    def _cache_gueltig(self) -> bool:
        return (
            self._cache_zeitpunkt is not None
            and datetime.now() - self._cache_zeitpunkt < self._cache_ttl
        )

    def _cache_aktualisieren(self) -> None:
        """Lädt beide Caches neu vom IMAP-Server."""
        self._cache_gesendet = self.gesendet_emails_sync(tage=90)
        self._cache_eingang = self.posteingang_absender_sync(tage=90)
        self._cache_zeitpunkt = datetime.now()

    def gesendet_emails_sync(self, tage: int = 90) -> set[str]:
        """Liest To:-Adressen aus dem Gesendet-Ordner der letzten `tage` Tage."""
        imap = self._verbinden()
        if not imap:
            return set()

        seit = (datetime.now() - timedelta(days=tage)).strftime("%d-%b-%Y")
        adressen: set[str] = set()

        try:
            # Gesendet-Ordner suchen
            ordner_gefunden = None
            for ordner_name in self._gesendet_ordner_namen:
                try:
                    status, _ = imap.select(f'"{ordner_name}"', readonly=True)
                    if status == "OK":
                        ordner_gefunden = ordner_name
                        break
                except Exception:
                    continue

            if not ordner_gefunden:
                logger.warning("Kein Gesendet-Ordner gefunden")
                return set()

            status, nachrichten = imap.search(None, f'SINCE {seit}')
            if status != "OK" or not nachrichten[0]:
                return set()

            ids = nachrichten[0].split()
            for msg_id in ids[-500:]:  # max 500 Nachrichten
                try:
                    _, msg_data = imap.fetch(msg_id, "(BODY[HEADER.FIELDS (TO)])")
                    if not msg_data or not msg_data[0]:
                        continue
                    raw = msg_data[0][1]
                    if isinstance(raw, bytes):
                        raw = raw.decode("utf-8", errors="replace")
                    for zeile in raw.splitlines():
                        if zeile.lower().startswith("to:"):
                            adresse = zeile[3:].strip().lower()
                            # Einfache Extraktion: "Name <email>" oder "email"
                            if "<" in adresse and ">" in adresse:
                                adresse = adresse[adresse.find("<") + 1:adresse.find(">")]
                            if "@" in adresse:
                                adressen.add(adresse.strip())
                except Exception:
                    continue

        except Exception as e:
            logger.error(f"IMAP Gesendet-Ordner Fehler: {e}")
        finally:
            try:
                imap.logout()
            except Exception:
                pass

        logger.debug(f"IMAP Gesendet: {len(adressen)} Adressen geladen")
        return adressen

    def posteingang_absender_sync(self, tage: int = 90) -> set[str]:
        """Liest From:-Adressen aus dem Posteingang der letzten `tage` Tage."""
        imap = self._verbinden()
        if not imap:
            return set()

        seit = (datetime.now() - timedelta(days=tage)).strftime("%d-%b-%Y")
        adressen: set[str] = set()

        try:
            imap.select("INBOX", readonly=True)
            status, nachrichten = imap.search(None, f'SINCE {seit}')
            if status != "OK" or not nachrichten[0]:
                return set()

            ids = nachrichten[0].split()
            for msg_id in ids[-500:]:
                try:
                    _, msg_data = imap.fetch(msg_id, "(BODY[HEADER.FIELDS (FROM)])")
                    if not msg_data or not msg_data[0]:
                        continue
                    raw = msg_data[0][1]
                    if isinstance(raw, bytes):
                        raw = raw.decode("utf-8", errors="replace")
                    for zeile in raw.splitlines():
                        if zeile.lower().startswith("from:"):
                            adresse = zeile[5:].strip().lower()
                            if "<" in adresse and ">" in adresse:
                                adresse = adresse[adresse.find("<") + 1:adresse.find(">")]
                            if "@" in adresse:
                                adressen.add(adresse.strip())
                except Exception:
                    continue

        except Exception as e:
            logger.error(f"IMAP Posteingang Fehler: {e}")
        finally:
            try:
                imap.logout()
            except Exception:
                pass

        logger.debug(f"IMAP Posteingang: {len(adressen)} Absender geladen")
        return adressen

    def bereits_kontaktiert(self, email: str) -> bool:
        """Prüft (mit Cache) ob diese E-Mail-Adresse bereits im Gesendet-Ordner ist."""
        if not self._cache_gueltig():
            self._cache_aktualisieren()
        return email.lower() in self._cache_gesendet
