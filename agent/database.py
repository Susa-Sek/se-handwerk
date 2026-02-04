"""SQLite-Datenbank für Deduplizierung, Verlauf und autonome Agenten."""

import json
import sqlite3
import threading
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
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        """Erstellt Datenbank und Tabellen falls nicht vorhanden."""
        self.conn = sqlite3.connect(str(self.db_pfad), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")

        # Bestehende Tabelle: listings
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
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_url_hash ON listings(url_hash)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON listings(status)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_datum ON listings(datum_gefunden)")

        # Neue Tabelle: plattformen – Plattform-Registry
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS plattformen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                basis_url TEXT NOT NULL,
                typ TEXT DEFAULT 'statisch',
                scraper_config TEXT,
                status TEXT DEFAULT 'vorgeschlagen',
                entdeckt_von TEXT,
                entdeckt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                erfolgsrate REAL DEFAULT 0.0,
                gesamt_listings INTEGER DEFAULT 0,
                relevante_listings INTEGER DEFAULT 0,
                fehler_zaehler INTEGER DEFAULT 0,
                notizen TEXT
            )
        """)

        # Neue Tabelle: scrape_log – Scrape-Protokoll
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS scrape_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plattform_name TEXT NOT NULL,
                suchbegriff TEXT,
                region TEXT,
                zeitpunkt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                dauer_sekunden REAL,
                ergebnis_anzahl INTEGER DEFAULT 0,
                relevante_anzahl INTEGER DEFAULT 0,
                fehler_text TEXT
            )
        """)

        # Neue Tabelle: entscheidungen – Offene Nutzer-Entscheidungen
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS entscheidungen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                typ TEXT NOT NULL,
                titel TEXT NOT NULL,
                beschreibung TEXT,
                daten_json TEXT,
                status TEXT DEFAULT 'offen',
                telegram_message_id INTEGER,
                erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                entschieden_am TIMESTAMP
            )
        """)

        # Neue Tabelle: lern_metriken – Erfolgs-Tracking
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS lern_metriken (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metrik_typ TEXT NOT NULL,
                schluessel TEXT NOT NULL,
                zeitraum TEXT NOT NULL,
                datum DATE NOT NULL,
                wert_anzahl INTEGER DEFAULT 0,
                wert_score REAL DEFAULT 0.0,
                wert_relevant INTEGER DEFAULT 0,
                UNIQUE(metrik_typ, schluessel, zeitraum, datum)
            )
        """)

        # Neue Tabelle: agent_aktionen – Audit-Log
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_aktionen (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                aktion TEXT NOT NULL,
                details TEXT,
                daten_json TEXT,
                zeitpunkt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        self.conn.commit()
        logger.info(f"Datenbank initialisiert: {self.db_pfad}")

    # ----------------------------------------------------------------
    # Bestehende Methoden: listings
    # ----------------------------------------------------------------

    def existiert(self, url_hash: str) -> bool:
        """Prüft ob ein Listing bereits in der DB existiert."""
        with self._lock:
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

        with self._lock:
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
        with self._lock:
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
        with self._lock:
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
        with self._lock:
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
        with self._lock:
            cursor = self.conn.execute(
                "DELETE FROM listings WHERE datum_gefunden < ?",
                (grenze.isoformat(),),
            )
            self.conn.commit()
        if cursor.rowcount > 0:
            logger.info(f"Cleanup: {cursor.rowcount} alte Einträge gelöscht")

    # ----------------------------------------------------------------
    # Neue Methoden: plattformen
    # ----------------------------------------------------------------

    def plattform_speichern(
        self,
        name: str,
        basis_url: str,
        typ: str = "entdeckt",
        scraper_config: Optional[dict] = None,
        status: str = "vorgeschlagen",
        entdeckt_von: Optional[str] = None,
        notizen: Optional[str] = None,
    ) -> int:
        """Speichert eine neue Plattform. Gibt die ID zurück."""
        config_json = json.dumps(scraper_config, ensure_ascii=False) if scraper_config else None
        with self._lock:
            cursor = self.conn.execute(
                """INSERT OR IGNORE INTO plattformen
                   (name, basis_url, typ, scraper_config, status, entdeckt_von, notizen)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (name, basis_url, typ, config_json, status, entdeckt_von, notizen),
            )
            self.conn.commit()
        if cursor.lastrowid:
            logger.info(f"Plattform gespeichert: {name} ({basis_url})")
        return cursor.lastrowid or 0

    def plattform_status_setzen(self, name: str, status: str):
        """Setzt den Status einer Plattform."""
        with self._lock:
            self.conn.execute(
                "UPDATE plattformen SET status = ? WHERE name = ?",
                (status, name),
            )
            self.conn.commit()
        logger.info(f"Plattform '{name}' → Status: {status}")

    def plattform_statistik_aktualisieren(
        self, name: str, gesamt: int, relevante: int
    ):
        """Aktualisiert Listing-Zähler und Erfolgsrate einer Plattform."""
        with self._lock:
            self.conn.execute(
                """UPDATE plattformen SET
                     gesamt_listings = gesamt_listings + ?,
                     relevante_listings = relevante_listings + ?,
                     erfolgsrate = CASE
                       WHEN (gesamt_listings + ?) > 0
                       THEN CAST(relevante_listings + ? AS REAL) / (gesamt_listings + ?)
                       ELSE 0.0
                     END
                   WHERE name = ?""",
                (gesamt, relevante, gesamt, relevante, gesamt, name),
            )
            self.conn.commit()

    def plattform_fehler_zaehlen(self, name: str):
        """Erhöht den Fehler-Zähler einer Plattform."""
        with self._lock:
            self.conn.execute(
                "UPDATE plattformen SET fehler_zaehler = fehler_zaehler + 1 WHERE name = ?",
                (name,),
            )
            self.conn.commit()

    def plattformen_laden(self, status: Optional[str] = None) -> list[dict]:
        """Lädt Plattformen, optional gefiltert nach Status."""
        with self._lock:
            if status:
                cursor = self.conn.execute(
                    "SELECT * FROM plattformen WHERE status = ? ORDER BY name",
                    (status,),
                )
            else:
                cursor = self.conn.execute(
                    "SELECT * FROM plattformen ORDER BY name"
                )
            ergebnisse = []
            for row in cursor.fetchall():
                d = dict(row)
                if d.get("scraper_config"):
                    try:
                        d["scraper_config"] = json.loads(d["scraper_config"])
                    except (json.JSONDecodeError, TypeError):
                        pass
                ergebnisse.append(d)
            return ergebnisse

    def plattform_laden(self, name: str) -> Optional[dict]:
        """Lädt eine einzelne Plattform nach Name."""
        with self._lock:
            cursor = self.conn.execute(
                "SELECT * FROM plattformen WHERE name = ?", (name,)
            )
            row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("scraper_config"):
            try:
                d["scraper_config"] = json.loads(d["scraper_config"])
            except (json.JSONDecodeError, TypeError):
                pass
        return d

    # ----------------------------------------------------------------
    # Neue Methoden: scrape_log
    # ----------------------------------------------------------------

    def scrape_log_eintragen(
        self,
        plattform_name: str,
        suchbegriff: Optional[str] = None,
        region: Optional[str] = None,
        dauer_sekunden: float = 0.0,
        ergebnis_anzahl: int = 0,
        relevante_anzahl: int = 0,
        fehler_text: Optional[str] = None,
    ):
        """Protokolliert einen Scrape-Vorgang."""
        with self._lock:
            self.conn.execute(
                """INSERT INTO scrape_log
                   (plattform_name, suchbegriff, region, dauer_sekunden,
                    ergebnis_anzahl, relevante_anzahl, fehler_text)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (plattform_name, suchbegriff, region, dauer_sekunden,
                 ergebnis_anzahl, relevante_anzahl, fehler_text),
            )
            self.conn.commit()

    def scrape_log_statistik(self, tage: int = 7) -> list[dict]:
        """Gibt Scrape-Statistik pro Plattform der letzten X Tage zurück."""
        grenze = (datetime.now() - timedelta(days=tage)).isoformat()
        with self._lock:
            cursor = self.conn.execute(
                """SELECT
                     plattform_name,
                     COUNT(*) as scrapes,
                     SUM(ergebnis_anzahl) as ergebnisse_gesamt,
                     SUM(relevante_anzahl) as relevante_gesamt,
                     AVG(dauer_sekunden) as avg_dauer,
                     SUM(CASE WHEN fehler_text IS NOT NULL THEN 1 ELSE 0 END) as fehler
                   FROM scrape_log
                   WHERE zeitpunkt >= ?
                   GROUP BY plattform_name
                   ORDER BY relevante_gesamt DESC""",
                (grenze,),
            )
            return [dict(row) for row in cursor.fetchall()]

    def scrape_log_suchbegriff_statistik(self, tage: int = 14) -> list[dict]:
        """Erfolgsrate pro Suchbegriff der letzten X Tage."""
        grenze = (datetime.now() - timedelta(days=tage)).isoformat()
        with self._lock:
            cursor = self.conn.execute(
                """SELECT
                     suchbegriff,
                     COUNT(*) as scrapes,
                     SUM(ergebnis_anzahl) as ergebnisse_gesamt,
                     SUM(relevante_anzahl) as relevante_gesamt
                   FROM scrape_log
                   WHERE zeitpunkt >= ? AND suchbegriff IS NOT NULL
                   GROUP BY suchbegriff
                   ORDER BY relevante_gesamt DESC""",
                (grenze,),
            )
            return [dict(row) for row in cursor.fetchall()]

    # ----------------------------------------------------------------
    # Neue Methoden: entscheidungen
    # ----------------------------------------------------------------

    def entscheidung_erstellen(
        self,
        typ: str,
        titel: str,
        beschreibung: str = "",
        daten_json: Optional[dict] = None,
    ) -> int:
        """Erstellt eine neue Entscheidung. Gibt die ID zurück."""
        daten_str = json.dumps(daten_json, ensure_ascii=False) if daten_json else None
        with self._lock:
            cursor = self.conn.execute(
                """INSERT INTO entscheidungen (typ, titel, beschreibung, daten_json)
                   VALUES (?, ?, ?, ?)""",
                (typ, titel, beschreibung, daten_str),
            )
            self.conn.commit()
        logger.info(f"Entscheidung erstellt: [{typ}] {titel}")
        return cursor.lastrowid

    def entscheidung_aktualisieren(
        self, entscheidung_id: int, status: str, telegram_message_id: Optional[int] = None
    ):
        """Aktualisiert Status und optional Message-ID einer Entscheidung."""
        with self._lock:
            if telegram_message_id is not None:
                self.conn.execute(
                    """UPDATE entscheidungen
                       SET status = ?, telegram_message_id = ?, entschieden_am = CURRENT_TIMESTAMP
                       WHERE id = ?""",
                    (status, telegram_message_id, entscheidung_id),
                )
            else:
                self.conn.execute(
                    """UPDATE entscheidungen
                       SET status = ?, entschieden_am = CURRENT_TIMESTAMP
                       WHERE id = ?""",
                    (status, entscheidung_id),
                )
            self.conn.commit()

    def entscheidung_telegram_id_setzen(self, entscheidung_id: int, telegram_message_id: int):
        """Setzt die Telegram-Message-ID für eine Entscheidung."""
        with self._lock:
            self.conn.execute(
                "UPDATE entscheidungen SET telegram_message_id = ? WHERE id = ?",
                (telegram_message_id, entscheidung_id),
            )
            self.conn.commit()

    def entscheidungen_offen(self) -> list[dict]:
        """Gibt alle offenen Entscheidungen zurück."""
        with self._lock:
            cursor = self.conn.execute(
                """SELECT * FROM entscheidungen
                   WHERE status = 'offen'
                   ORDER BY erstellt_am ASC"""
            )
            ergebnisse = []
            for row in cursor.fetchall():
                d = dict(row)
                if d.get("daten_json"):
                    try:
                        d["daten_json"] = json.loads(d["daten_json"])
                    except (json.JSONDecodeError, TypeError):
                        pass
                ergebnisse.append(d)
            return ergebnisse

    def entscheidung_laden(self, entscheidung_id: int) -> Optional[dict]:
        """Lädt eine Entscheidung nach ID."""
        with self._lock:
            cursor = self.conn.execute(
                "SELECT * FROM entscheidungen WHERE id = ?",
                (entscheidung_id,),
            )
            row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("daten_json"):
            try:
                d["daten_json"] = json.loads(d["daten_json"])
            except (json.JSONDecodeError, TypeError):
                pass
        return d

    def entscheidung_by_telegram_id(self, telegram_message_id: int) -> Optional[dict]:
        """Findet eine Entscheidung anhand der Telegram-Message-ID."""
        with self._lock:
            cursor = self.conn.execute(
                "SELECT * FROM entscheidungen WHERE telegram_message_id = ?",
                (telegram_message_id,),
            )
            row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        if d.get("daten_json"):
            try:
                d["daten_json"] = json.loads(d["daten_json"])
            except (json.JSONDecodeError, TypeError):
                pass
        return d

    def entscheidungen_abgelaufene_schliessen(self, timeout_stunden: int = 48):
        """Schließt Entscheidungen die älter als timeout_stunden sind."""
        grenze = (datetime.now() - timedelta(hours=timeout_stunden)).isoformat()
        with self._lock:
            cursor = self.conn.execute(
                """UPDATE entscheidungen
                   SET status = 'abgelaufen', entschieden_am = CURRENT_TIMESTAMP
                   WHERE status = 'offen' AND erstellt_am < ?""",
                (grenze,),
            )
            self.conn.commit()
        if cursor.rowcount > 0:
            logger.info(f"{cursor.rowcount} Entscheidungen als abgelaufen markiert")

    def entscheidungen_genehmigt_unverarbeitet(self) -> list[dict]:
        """Gibt genehmigte Entscheidungen zurück die noch verarbeitet werden müssen."""
        with self._lock:
            cursor = self.conn.execute(
                """SELECT * FROM entscheidungen
                   WHERE status = 'genehmigt'
                   ORDER BY entschieden_am ASC"""
            )
            ergebnisse = []
            for row in cursor.fetchall():
                d = dict(row)
                if d.get("daten_json"):
                    try:
                        d["daten_json"] = json.loads(d["daten_json"])
                    except (json.JSONDecodeError, TypeError):
                        pass
                ergebnisse.append(d)
            return ergebnisse

    # ----------------------------------------------------------------
    # Neue Methoden: lern_metriken
    # ----------------------------------------------------------------

    def metrik_speichern(
        self,
        metrik_typ: str,
        schluessel: str,
        zeitraum: str,
        datum: str,
        wert_anzahl: int = 0,
        wert_score: float = 0.0,
        wert_relevant: int = 0,
    ):
        """Speichert oder aktualisiert eine Lern-Metrik (UPSERT)."""
        with self._lock:
            self.conn.execute(
                """INSERT INTO lern_metriken
                   (metrik_typ, schluessel, zeitraum, datum, wert_anzahl, wert_score, wert_relevant)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(metrik_typ, schluessel, zeitraum, datum) DO UPDATE SET
                     wert_anzahl = wert_anzahl + excluded.wert_anzahl,
                     wert_score = excluded.wert_score,
                     wert_relevant = wert_relevant + excluded.wert_relevant""",
                (metrik_typ, schluessel, zeitraum, datum, wert_anzahl, wert_score, wert_relevant),
            )
            self.conn.commit()

    def metriken_laden(
        self,
        metrik_typ: str,
        zeitraum: str = "tag",
        tage: int = 30,
    ) -> list[dict]:
        """Lädt Metriken eines bestimmten Typs für die letzten X Tage."""
        grenze = (datetime.now() - timedelta(days=tage)).strftime("%Y-%m-%d")
        with self._lock:
            cursor = self.conn.execute(
                """SELECT * FROM lern_metriken
                   WHERE metrik_typ = ? AND zeitraum = ? AND datum >= ?
                   ORDER BY datum DESC, schluessel ASC""",
                (metrik_typ, zeitraum, grenze),
            )
            return [dict(row) for row in cursor.fetchall()]

    def metriken_zusammenfassung(self, tage: int = 7) -> dict:
        """Gibt eine Zusammenfassung aller Metriken zurück."""
        grenze = (datetime.now() - timedelta(days=tage)).strftime("%Y-%m-%d")
        with self._lock:
            # Suchbegriff-Erfolg
            cursor = self.conn.execute(
                """SELECT schluessel, SUM(wert_anzahl) as gesamt, SUM(wert_relevant) as relevant
                   FROM lern_metriken
                   WHERE metrik_typ = 'suchbegriff_erfolg' AND datum >= ?
                   GROUP BY schluessel
                   ORDER BY relevant DESC""",
                (grenze,),
            )
            suchbegriffe = [dict(row) for row in cursor.fetchall()]

            # Plattform-Erfolg
            cursor = self.conn.execute(
                """SELECT schluessel, SUM(wert_anzahl) as gesamt, SUM(wert_relevant) as relevant,
                          AVG(wert_score) as avg_score
                   FROM lern_metriken
                   WHERE metrik_typ = 'plattform_erfolg' AND datum >= ?
                   GROUP BY schluessel
                   ORDER BY relevant DESC""",
                (grenze,),
            )
            plattformen = [dict(row) for row in cursor.fetchall()]

        return {
            "suchbegriffe": suchbegriffe,
            "plattformen": plattformen,
            "zeitraum_tage": tage,
        }

    # ----------------------------------------------------------------
    # Neue Methoden: agent_aktionen (Audit-Log)
    # ----------------------------------------------------------------

    def aktion_loggen(
        self,
        agent_name: str,
        aktion: str,
        details: Optional[str] = None,
        daten_json: Optional[dict] = None,
    ):
        """Protokolliert eine Agent-Aktion."""
        daten_str = json.dumps(daten_json, ensure_ascii=False) if daten_json else None
        with self._lock:
            self.conn.execute(
                """INSERT INTO agent_aktionen (agent_name, aktion, details, daten_json)
                   VALUES (?, ?, ?, ?)""",
                (agent_name, aktion, details, daten_str),
            )
            self.conn.commit()

    def aktionen_laden(self, agent_name: Optional[str] = None, limit: int = 50) -> list[dict]:
        """Lädt Agent-Aktionen, optional gefiltert nach Agent."""
        with self._lock:
            if agent_name:
                cursor = self.conn.execute(
                    """SELECT * FROM agent_aktionen
                       WHERE agent_name = ?
                       ORDER BY zeitpunkt DESC LIMIT ?""",
                    (agent_name, limit),
                )
            else:
                cursor = self.conn.execute(
                    """SELECT * FROM agent_aktionen
                       ORDER BY zeitpunkt DESC LIMIT ?""",
                    (limit,),
                )
            return [dict(row) for row in cursor.fetchall()]

    # ----------------------------------------------------------------
    # Bestehend: close
    # ----------------------------------------------------------------

    def close(self):
        """Schließt die Datenbankverbindung."""
        if self.conn:
            self.conn.close()
