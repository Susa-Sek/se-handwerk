"""Scraper für Facebook-Gruppen – Platzhalter."""

from datetime import datetime

from models import Listing, Quelle
from scrapers.base import BaseScraper


class FacebookScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "facebook"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        # Facebook benötigt API/Login; Platzhalter
        self.logger.debug("Facebook: übersprungen (nicht implementiert)")
        return []
