"""SQLite-Datenbank für Deduplizierung und Verlauf."""

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from models import EmailKontakt
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.db")


class Database:
    """SQLite-Datenbank-Manager für den Akquise-Agenten."""

    def __init__(self, db_pfad: str = "se_handwerk.db"):
        self.db_pfad = Path(__file__).resolve().parent / db_pfad
        self.conn: Optional[sqlite3.Connection] = None
        self._init_db()

    def _init_db(self):
        """Erstellt Datenbank und Tabellen falls nicht vorhanden."""
        self.conn = sqlite3.connect(str(self.db_pfad))
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url_hash TEXT UNIQUE NOT NULL,
                url TEXT NOT NULL,
                titel TEXT NOT NULL,
                beschreibung TEXT,
                ort TEXT,
                quelle TEXT NOT NULL,
                kategorie TEXT,
                score INTEGER DEFAULT 0,
                prioritaet TEXT,
                status TEXT DEFAULT 'neu',
                antwort_vorschlag TEXT,
                datum_gefunden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                datum_aktualisiert TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_url_hash ON listings(url_hash)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_status ON listings(status)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_datum ON listings(datum_gefunden)
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS email_kontakte (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_url_hash TEXT NOT NULL,
                empfaenger_email TEXT NOT NULL,
                betreff TEXT NOT NULL,
                nachricht_text TEXT NOT NULL,
                status TEXT DEFAULT 'ausstehend',
                gesendet_am TIMESTAMP,
                follow_up_1_am TIMESTAMP,
                follow_up_2_am TIMESTAMP,
                antwort_erhalten_am TIMESTAMP,
                erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(empfaenger_email)
            )
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_kontakt_status ON email_kontakte(status)
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS einstellungen (
                schluessel TEXT PRIMARY KEY,
                wert TEXT NOT NULL
            )
        """)
        self.conn.commit()
        logger.info(f"Datenbank initialisiert: {self.db_pfad}")

    def existiert(self, url_hash: str) -> bool:
        """Prüft ob ein Listing bereits in der DB existiert."""
        cursor = self.conn.execute(
            "SELECT 1 FROM listings WHERE url_hash = ?", (url_hash,)
        )
        return cursor.fetchone() is not None

    def speichern(
        self,
        url_hash: str,
        url: str,
        titel: str,
        beschreibung: str,
        ort: str,
        quelle: str,
        kategorie: str,
        score: int,
        prioritaet: str,
        status: str = "neu",
        antwort_vorschlag: str = "",
    ) -> bool:
        """Speichert ein neues Listing. Gibt True zurück wenn neu eingefügt."""
        if self.existiert(url_hash):
            logger.debug(f"Listing bereits bekannt: {titel[:50]}")
            return False

        self.conn.execute(
            """INSERT INTO listings
               (url_hash, url, titel, beschreibung, ort, quelle,
                kategorie, score, prioritaet, status, antwort_vorschlag)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                url_hash, url, titel, beschreibung, ort, quelle,
                kategorie, score, prioritaet, status, antwort_vorschlag,
            ),
        )
        self.conn.commit()
        logger.info(f"Neues Listing gespeichert: {titel[:50]} (Score: {score})")
        return True

    def status_aktualisieren(self, url_hash: str, neuer_status: str):
        """Aktualisiert den Status eines Listings."""
        self.conn.execute(
            """UPDATE listings
               SET status = ?, datum_aktualisiert = CURRENT_TIMESTAMP
               WHERE url_hash = ?""",
            (neuer_status, url_hash),
        )
        self.conn.commit()

    def statistik_heute(self) -> dict:
        """Gibt Tagesstatistik zurück."""
        heute = datetime.now().strftime("%Y-%m-%d")
        cursor = self.conn.execute(
            """SELECT
                 COUNT(*) as gesamt,
                 SUM(CASE WHEN prioritaet = 'gruen' THEN 1 ELSE 0 END) as gruen,
                 SUM(CASE WHEN prioritaet = 'gelb' THEN 1 ELSE 0 END) as gelb,
                 SUM(CASE WHEN prioritaet = 'rot' THEN 1 ELSE 0 END) as rot,
                 SUM(CASE WHEN status = 'beantwortet' THEN 1 ELSE 0 END) as beantwortet
               FROM listings
               WHERE DATE(datum_gefunden) = ?""",
            (heute,),
        )
        row = cursor.fetchone()
        return {
            "gesamt": row["gesamt"] or 0,
            "gruen": row["gruen"] or 0,
            "gelb": row["gelb"] or 0,
            "rot": row["rot"] or 0,
            "beantwortet": row["beantwortet"] or 0,
        }

    def top_listings_heute(self, limit: int = 3) -> list[dict]:
        """Gibt die Top-Listings von heute zurück (nach Score)."""
        heute = datetime.now().strftime("%Y-%m-%d")
        cursor = self.conn.execute(
            """SELECT url, titel, ort, quelle, score, prioritaet, kategorie
               FROM listings
               WHERE DATE(datum_gefunden) = ?
               ORDER BY score DESC
               LIMIT ?""",
            (heute, limit),
        )
        return [dict(row) for row in cursor.fetchall()]

    def cleanup(self, tage: int = 30):
        """Löscht Einträge älter als X Tage."""
        grenze = datetime.now() - timedelta(days=tage)
        cursor = self.conn.execute(
            "DELETE FROM listings WHERE datum_gefunden < ?",
            (grenze.isoformat(),),
        )
        self.conn.commit()
        if cursor.rowcount > 0:
            logger.info(f"Cleanup: {cursor.rowcount} alte Einträge gelöscht")

    # ── E-Mail-Outreach ──────────────────────────────────────────────────────

    def email_kontakt_speichern(self, kontakt: EmailKontakt) -> Optional[int]:
        """INSERT OR IGNORE. Gibt die id zurück oder None wenn bereits vorhanden."""
        cursor = self.conn.execute(
            """INSERT OR IGNORE INTO email_kontakte
               (listing_url_hash, empfaenger_email, betreff, nachricht_text, status)
               VALUES (?, ?, ?, ?, ?)""",
            (
                kontakt.listing_url_hash,
                kontakt.empfaenger_email,
                kontakt.betreff,
                kontakt.nachricht_text,
                kontakt.status.value,
            ),
        )
        self.conn.commit()
        if cursor.rowcount == 0:
            logger.debug(f"E-Mail bereits vorhanden: {kontakt.empfaenger_email}")
            return None
        logger.info(f"E-Mail-Kontakt gespeichert: {kontakt.empfaenger_email} (id={cursor.lastrowid})")
        return cursor.lastrowid

    def email_kontakt_status_setzen(self, id: int, status: str, **zeitstempel) -> None:
        """Aktualisiert Status und optionale Zeitstempel-Felder."""
        erlaubte_felder = {"gesendet_am", "follow_up_1_am", "follow_up_2_am", "antwort_erhalten_am"}
        felder = {k: v for k, v in zeitstempel.items() if k in erlaubte_felder}
        set_teile = ["status = ?"]
        werte = [status]
        for feld, wert in felder.items():
            set_teile.append(f"{feld} = ?")
            werte.append(wert.isoformat() if isinstance(wert, datetime) else wert)
        werte.append(id)
        self.conn.execute(
            f"UPDATE email_kontakte SET {', '.join(set_teile)} WHERE id = ?",
            werte,
        )
        self.conn.commit()

    def email_bereits_kontaktiert(self, email: str) -> bool:
        """Prüft ob diese E-Mail-Adresse bereits in der Tabelle existiert."""
        cursor = self.conn.execute(
            "SELECT 1 FROM email_kontakte WHERE empfaenger_email = ?", (email.lower(),)
        )
        return cursor.fetchone() is not None

    def email_kontakte_laden(self, status: str) -> list[dict]:
        """Lädt alle Kontakte mit gegebenem Status (inkl. Listing-Titel via JOIN)."""
        cursor = self.conn.execute(
            """SELECT k.*, l.titel
               FROM email_kontakte k
               LEFT JOIN listings l ON k.listing_url_hash = l.url_hash
               WHERE k.status = ?
               ORDER BY k.erstellt_am ASC""",
            (status,),
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            d = dict(row)
            # Zeitstempel-Strings in datetime-Objekte umwandeln
            for feld in ("gesendet_am", "follow_up_1_am", "follow_up_2_am", "antwort_erhalten_am"):
                if d.get(feld):
                    try:
                        d[feld] = datetime.fromisoformat(d[feld])
                    except (ValueError, TypeError):
                        d[feld] = None
            result.append(d)
        return result

    def email_kontakt_laden(self, id: int) -> Optional[dict]:
        """Lädt einen Kontakt anhand der id (inkl. Listing-Titel via JOIN)."""
        cursor = self.conn.execute(
            """SELECT k.*, l.titel
               FROM email_kontakte k
               LEFT JOIN listings l ON k.listing_url_hash = l.url_hash
               WHERE k.id = ?""",
            (id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        for feld in ("gesendet_am", "follow_up_1_am", "follow_up_2_am", "antwort_erhalten_am"):
            if d.get(feld):
                try:
                    d[feld] = datetime.fromisoformat(d[feld])
                except (ValueError, TypeError):
                    d[feld] = None
        return d

    # ── Einstellungen (Key-Value-Store) ──────────────────────────────────────

    def setting_lesen(self, schluessel: str) -> Optional[str]:
        """Liest einen persistenten Einstellungswert."""
        cursor = self.conn.execute(
            "SELECT wert FROM einstellungen WHERE schluessel = ?", (schluessel,)
        )
        row = cursor.fetchone()
        return row["wert"] if row else None

    def setting_setzen(self, schluessel: str, wert: str) -> None:
        """Setzt einen persistenten Einstellungswert (upsert)."""
        self.conn.execute(
            "INSERT OR REPLACE INTO einstellungen (schluessel, wert) VALUES (?, ?)",
            (schluessel, wert),
        )
        self.conn.commit()

    def close(self):
        """Schließt die Datenbankverbindung."""
        if self.conn:
            self.conn.close()
