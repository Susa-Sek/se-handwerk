"""Abstrakte Basis-Klasse für alle Scraper."""

import random
import time
from abc import ABC, abstractmethod
from typing import Optional

import requests
from fake_useragent import UserAgent

from models import Listing
from utils.logger import setup_logger


class BaseScraper(ABC):
    """Basis-Scraper mit Rate-Limiting, User-Agent Rotation und Retry-Logik."""

    def __init__(self, config: dict):
        self.config = config
        self.scraper_config = config.get("scraper", {})
        self.logger = setup_logger(f"se_handwerk.{self.name}")
        self.session = requests.Session()
        self._ua = UserAgent()
        self._update_headers()

    @property
    @abstractmethod
    def name(self) -> str:
        """Name des Scrapers für Logging."""
        ...

    @abstractmethod
    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Führt eine Suche durch und gibt Listings zurück."""
        ...

    def _update_headers(self):
        """Setzt zufälligen User-Agent und Standard-Headers."""
        self.session.headers.update({
            "User-Agent": self._ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "DNT": "1",
        })

    def _request(self, url: str, params: Optional[dict] = None) -> Optional[requests.Response]:
        """HTTP-Request mit Retry-Logik und Rate-Limiting."""
        max_retries = self.scraper_config.get("max_retries", 3)
        timeout = self.scraper_config.get("timeout_sekunden", 30)
        delay_range = self.scraper_config.get("request_delay_sekunden", [2, 5])

        for attempt in range(1, max_retries + 1):
            try:
                # Rate-Limiting: zufällige Pause
                delay = random.uniform(delay_range[0], delay_range[1])
                time.sleep(delay)

                # User-Agent bei jedem Request rotieren
                self._update_headers()

                self.logger.debug(f"Request #{attempt}: {url}")
                response = self.session.get(url, params=params, timeout=timeout)

                if response.status_code == 200:
                    return response

                if response.status_code == 429:
                    wait = min(30, 5 * attempt)
                    self.logger.warning(f"Rate-Limit (429) - warte {wait}s")
                    time.sleep(wait)
                    continue

                if response.status_code == 403:
                    self.logger.warning(f"Zugriff verweigert (403) für {url}")
                    return None

                self.logger.warning(
                    f"HTTP {response.status_code} für {url} (Versuch {attempt}/{max_retries})"
                )

            except requests.exceptions.Timeout:
                self.logger.warning(f"Timeout für {url} (Versuch {attempt}/{max_retries})")
            except requests.exceptions.ConnectionError:
                self.logger.warning(f"Verbindungsfehler für {url} (Versuch {attempt}/{max_retries})")
            except requests.exceptions.RequestException as e:
                self.logger.error(f"Request-Fehler: {e}")
                return None

        self.logger.error(f"Alle {max_retries} Versuche fehlgeschlagen für {url}")
        return None

    def alle_suchen(self, suchbegriffe: list[str], regionen: list[str]) -> list[Listing]:
        """Durchsucht alle Kombinationen aus Suchbegriffen und Regionen."""
        alle_listings = []
        max_pro_suche = self.scraper_config.get("max_ergebnisse_pro_suche", 20)

        for begriff in suchbegriffe:
            for region in regionen:
                self.logger.info(f"Suche: '{begriff}' in '{region}'")
                try:
                    listings = self.suchen(begriff, region)
                    listings = listings[:max_pro_suche]
                    alle_listings.extend(listings)
                    self.logger.info(f"  → {len(listings)} Ergebnisse")
                except Exception as e:
                    self.logger.error(f"Fehler bei Suche '{begriff}' / '{region}': {e}")

        # Deduplizierung innerhalb dieser Suche (nach URL)
        gesehen = set()
        unique = []
        for listing in alle_listings:
            if listing.url_hash not in gesehen:
                gesehen.add(listing.url_hash)
                unique.append(listing)

        self.logger.info(
            f"{self.name}: {len(unique)} eindeutige Ergebnisse "
            f"(von {len(alle_listings)} gesamt)"
        )
        return unique
