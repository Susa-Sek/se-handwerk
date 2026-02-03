"""Scraper für Google-Suche (Site-Filter)."""

from datetime import datetime
from urllib.parse import quote_plus

from models import Listing, Quelle
from scrapers.base import BaseScraper

try:
    from googlesearch import search
except ImportError:
    search = None


class GoogleScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "google"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        if search is None:
            self.logger.warning("googlesearch-python nicht installiert")
            return []
        sites = self.config.get("google", {}).get("site_filter", ["nebenan.de", "kleinanzeigen.de"])
        max_results = self.config.get("google", {}).get("max_results", 10)
        query = f'"{suchbegriff}" {region} ({" OR ".join("site:" + s for s in sites)})'
        self.logger.debug(f"Google-Query: {query}")
        listings = []
        try:
            for url in search(query):
                if len(listings) >= max_results:
                    break
                listings.append(Listing(
                    url=url,
                    titel=suchbegriff,
                    beschreibung="",
                    ort=region,
                    quelle=Quelle.GOOGLE,
                    datum_gefunden=datetime.now(),
                ))
        except Exception as e:
            self.logger.error(f"Google-Suche fehlgeschlagen: {e}")
        self.logger.info(f"  → {len(listings)} Ergebnisse")
        return listings
