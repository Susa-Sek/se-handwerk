"""SQLite-Datenbank für Deduplizierung und Verlauf."""

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

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

    def close(self):
        """Schließt die Datenbankverbindung."""
        if self.conn:
            self.conn.close()
