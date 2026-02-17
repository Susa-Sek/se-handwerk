"""
Geolokalisierung und Distanzberechnung für 70km-Radium-Filtering.
Verwendet Nominatim API (OpenStreetMap) zur Koordinatenbestimmung.
"""

import re
import sqlite3
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple

from utils.logger import setup_logger

logger = setup_logger("se_handwerk.geo_distance")


class GeoDistanceFilter:
    """
    Filtert Anfragen nach 70km Radius um Heilbronn.
    Verwendet Nominatim API für PLZ/Ort → Koordinaten.
    """

    # Heilbronn Koordinaten
    HEILBRONN_LAT = 49.1427
    HEILBRONN_LON = 9.2109
    DEFAULT_RADIUS_KM = 70

    # Nominatim API Settings
    NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"
    NOMINATIM_USER_AGENT = "se_handwerk_agent"
    RATE_LIMIT_SECONDS = 1.1  # 1 req/s + Puffer

    def __init__(self, config: dict):
        self.config = config

        # Config lesen
        geo_config = config.get("nominatim", {})
        self.enabled = geo_config.get("enabled", True)
        self.radius_km = config.get("suchgebiet", {}).get("radius_km", self.DEFAULT_RADIUS_KM)
        self.base_url = geo_config.get("base_url", self.NOMINATIM_BASE_URL)
        self.user_agent = geo_config.get("user_agent", self.NOMINATIM_USER_AGENT)
        self.cache_tage = geo_config.get("cache_tage", 30)

        # Cache initialisieren
        self.cache_db_pfad = Path(__file__).resolve().parent.parent / "geo_cache.db"
        self._cache_lock = threading.Lock()
        self._cache_conn: Optional[sqlite3.Connection] = None
        self._init_cache()

        # Rate Limiting
        self._last_request_time = 0
        self._rate_lock = threading.Lock()

        logger.info(
            f"GeoDistanceFilter initialisiert: Radius {self.radius_km}km, "
            f"Nominatim: {'aktiviert' if self.enabled else 'deaktiviert'}"
        )

    def _init_cache(self):
        """Initialisiert den SQLite-Cache für Koordinaten."""
        self._cache_conn = sqlite3.connect(str(self.cache_db_pfad), check_same_thread=False)
        self._cache_conn.execute("PRAGMA journal_mode=WAL")
        self._cache_conn.execute("""
            CREATE TABLE IF NOT EXISTS geo_cache (
                ort_key TEXT UNIQUE NOT NULL,
                latitude REAL,
                longitude REAL,
                anfrage_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ort_key)
            )
        """)
        self._cache_conn.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON geo_cache(anfrage_timestamp)")
        self._cache_conn.commit()

        # Cleanup alte Einträge
        self._cleanup_cache()

    def _cleanup_cache(self):
        """Löscht Einträge älter als cache_tage."""
        grenze = (datetime.now() - timedelta(days=self.cache_tage)).isoformat()
        with self._cache_lock:
            cursor = self._cache_conn.execute(
                "DELETE FROM geo_cache WHERE anfrage_timestamp < ?",
                (grenze,)
            )
            self._cache_conn.commit()
        if cursor.rowcount > 0:
            logger.debug(f"Geo-Cache: {cursor.rowcount} alte Einträge gelöscht")

    def _get_from_cache(self, ort_key: str) -> Optional[Tuple[float, float]]:
        """Holt Koordinaten aus dem Cache."""
        with self._cache_lock:
            cursor = self._cache_conn.execute(
                "SELECT latitude, longitude FROM geo_cache WHERE ort_key = ?",
                (ort_key,)
            )
            row = cursor.fetchone()
        return (row[0], row[1]) if row else None

    def _save_to_cache(self, ort_key: str, lat: float, lon: float):
        """Speichert Koordinaten im Cache."""
        with self._cache_lock:
            self._cache_conn.execute("""
                INSERT OR REPLACE INTO geo_cache (ort_key, latitude, longitude, anfrage_timestamp)
                VALUES (?, ?, ?, ?)
            """, (ort_key, lat, lon, datetime.now().isoformat()))
            self._cache_conn.commit()

    def _extract_plz(self, text: str) -> Optional[str]:
        """Extrahiert die PLZ aus einem Text."""
        plz_match = re.search(r'\b(\d{5})\b', text)
        return plz_match.group(1) if plz_match else None

    def _extract_ort(self, text: str) -> Optional[str]:
        """Extrahiert den Ortsnamen (versucht PLZ zuerst)."""
        # PLZ hat Priorität
        plz = self._extract_plz(text)
        if plz:
            return plz

        # Ortsnamen aus Text (vereinfacht)
        # Entferne PLZ, Zahlen und Sonderzeichen, nimm das Wort nach Komma
        text_clean = re.sub(r'\d{5}\s*', '', text)
        parts = text_clean.split(',')

        for part in parts:
            part = part.strip()
            # Prüfen ob es aussieht wie ein deutscher Ortsname
            if len(part) >= 3 and part[0].isupper():
                return part

        return None

    def _nominatim_query(self, query: str) -> Optional[Tuple[float, float]]:
        """Führt eine Nominatim-Abfrage durch mit Rate-Limiting."""
        if not self.enabled:
            logger.debug(f"Nominatim deaktiviert - PLZ {query} wird übersprungen")
            return None

        # Rate-Limiting einhalten
        with self._rate_lock:
            elapsed = time.time() - self._last_request_time
            if elapsed < self.RATE_LIMIT_SECONDS:
                time.sleep(self.RATE_LIMIT_SECONDS - elapsed)

        try:
            import requests
            params = {
                'q': query,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'de',
                'addressdetails': 1
            }
            headers = {
                'User-Agent': self.user_agent
            }

            logger.debug(f"Nominatim Query: {query}")
            response = requests.get(
                f"{self.base_url}/search",
                params=params,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()

            data = response.json()
            if data and len(data) > 0:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                logger.debug(f"Nominatim Ergebnis für {query}: {lat}, {lon}")
                return (lat, lon)

            logger.debug(f"Nominatim: Kein Ergebnis für {query}")
            return None

        except requests.RequestException as e:
            logger.warning(f"Nominatim API Fehler für {query}: {e}")
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Nominatim Response Fehler für {query}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unerwarteter Fehler bei Nominatim Query {query}: {e}")
            return None
        finally:
            with self._rate_lock:
                self._last_request_time = time.time()

    def _get_coordinates(self, ort_text: str) -> Optional[Tuple[float, float]]:
        """Holt Koordinaten für einen Ort (mit Cache)."""
        if not ort_text or not isinstance(ort_text, str):
            return None

        ort_key = self._extract_ort(ort_text.strip())
        if not ort_key:
            return None

        # Cache prüfen
        cached = self._get_from_cache(ort_key)
        if cached:
            logger.debug(f"Geo-Cache Hit: {ort_key} -> {cached}")
            return cached

        # Nominatim Query
        coords = self._nominatim_query(ort_key)
        if coords:
            self._save_to_cache(ort_key, coords[0], coords[1])
            return coords

        return None

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Berechnet die Distanz zwischen zwei Koordinaten mittels Haversine-Formel.
        Rückgabe in Kilometern.
        """
        import math

        # Erdradius in Kilometern
        R = 6371.0

        # Umrechnung in Bogenmaß
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        # Haversine-Formel
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def ist_im_radius(self, ort_text: str) -> Tuple[bool, Optional[float], Optional[str]]:
        """
        Prüft ob ein Ort im 70km-Radius um Heilbronn liegt.

        Returns:
            (ist_im_radius, distanz_km, grund)
        """
        if not ort_text:
            return True, None, None  # Kein Ort → nicht ausschließen

        coords = self._get_coordinates(ort_text)
        if coords is None:
            # Nominatim fehlgeschlagen oder deaktiviert → Fallback auf PLZ-Präfix
            plz = self._extract_plz(ort_text)
            if plz:
                # PLZ-Präfix Fallback (70xxx, 71xxx, 69xxx, 68xxx, 75xxx)
                prefix = plz[:2]
                erlaubte_prefixe = ["74", "70", "71", "69", "68", "75", "72", "73"]
                if prefix in erlaubte_prefixe:
                    return True, None, f"PLZ-Fallback: {plz}"
                else:
                    return False, None, f"PLZ außerhalb: {plz} ({ort_text})"
            return True, None, None  # Keine Info → nicht ausschließen

        distanz = self.haversine_distance(
            self.HEILBRONN_LAT, self.HEILBRONN_LON,
            coords[0], coords[1]
        )

        im_radius = distanz <= self.radius_km
        grund = None if im_radius else f"Zu weit entfernt: {distanz:.1f}km (Max: {self.radius_km}km)"

        logger.info(f"Distanz-Check: {ort_text} -> {distanz:.1f}km -> {'OK' if im_radius else 'AUSSCHLUSS'}")
        return im_radius, distanz, grund

    def close(self):
        """Schließt die Cache-Datenbank."""
        if self._cache_conn:
            self._cache_conn.close()


# Singleton-Instanz für die Anwendung
_geo_filter: Optional[GeoDistanceFilter] = None


def get_geo_filter(config: dict) -> GeoDistanceFilter:
    """Gibt die GeoDistanceFilter-Instanz zurück (Singleton)."""
    global _geo_filter
    if _geo_filter is None:
        _geo_filter = GeoDistanceFilter(config)
    return _geo_filter