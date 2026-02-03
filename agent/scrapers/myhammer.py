"""Scraper für MyHammer – aktuell deaktiviert (403)."""

from datetime import datetime

from models import Listing, Quelle
from scrapers.base import BaseScraper


class MyHammerScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "myhammer"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        # MyHammer blockiert oft; optional später mit anderer Strategie
        self.logger.debug("MyHammer: übersprungen (enabled, aber oft 403)")
        return []
