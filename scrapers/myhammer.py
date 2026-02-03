"""Scraper für MyHammer.de – Handwerker-Auftragsplattform."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper


# MyHammer Kategorien-Mapping
KATEGORIEN_URLS = {
    "boden": "bodenbelaege",
    "montage": "moebelaufbau",
    "uebergabe": "renovierung",
    "maler": "malerarbeiten",
}

# MyHammer Regionen-Mapping (Slugs)
REGION_SLUGS = {
    "Heilbronn": "heilbronn",
    "Stuttgart": "stuttgart",
    "Ludwigsburg": "ludwigsburg",
    "Mannheim": "mannheim",
}


class MyHammerScraper(BaseScraper):
    """Durchsucht MyHammer.de nach Handwerks-Aufträgen."""

    @property
    def name(self) -> str:
        return "myhammer"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf MyHammer nach passenden Aufträgen."""
        basis_url = self.config.get("myhammer", {}).get(
            "basis_url", "https://www.myhammer.de"
        )

        # Suchanfrage an MyHammer
        encoded = quote_plus(suchbegriff)
        region_slug = REGION_SLUGS.get(region, region.lower())

        # MyHammer Auftragssuche
        url = f"{basis_url}/suche?q={encoded}&location={region_slug}"

        response = self._request(url)
        if not response:
            # Fallback: Kategorie-basierte Suche
            return self._suche_per_kategorie(basis_url, suchbegriff, region_slug)

        return self._parse_ergebnisse(response.text, basis_url)

    def _suche_per_kategorie(
        self, basis_url: str, suchbegriff: str, region_slug: str
    ) -> list[Listing]:
        """Fallback: Durchsucht MyHammer-Kategorien."""
        listings = []

        # Relevante Kategorien basierend auf Suchbegriff erkennen
        suchbegriff_lower = suchbegriff.lower()
        relevante_kats = []

        boden_keywords = ["laminat", "vinyl", "boden", "belag", "teppich"]
        montage_keywords = ["montage", "aufbau", "möbel", "ikea", "rack"]
        uebergabe_keywords = ["übergabe", "renovier", "auszug", "streichen"]

        if any(kw in suchbegriff_lower for kw in boden_keywords):
            relevante_kats.append("boden")
        if any(kw in suchbegriff_lower for kw in montage_keywords):
            relevante_kats.append("montage")
        if any(kw in suchbegriff_lower for kw in uebergabe_keywords):
            relevante_kats.extend(["uebergabe", "maler"])

        if not relevante_kats:
            relevante_kats = ["boden", "montage"]

        for kat_key in relevante_kats:
            kat_slug = KATEGORIEN_URLS.get(kat_key, kat_key)
            url = f"{basis_url}/auftraege/{kat_slug}/{region_slug}"

            response = self._request(url)
            if response:
                listings.extend(self._parse_ergebnisse(response.text, basis_url))

        return listings

    def _parse_ergebnisse(self, html: str, basis_url: str) -> list[Listing]:
        """Parst MyHammer-Suchergebnisse."""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        # MyHammer Auftrags-Cards
        auftraege = soup.select(
            ".job-card, .auction-item, .search-result-item, "
            "[data-testid='job-card'], .job-list-item"
        )

        for auftrag in auftraege:
            listing = self._parse_auftrag(auftrag, basis_url)
            if listing:
                listings.append(listing)

        self.logger.debug(f"MyHammer: {len(listings)} Aufträge geparst")
        return listings

    def _parse_auftrag(self, element, basis_url: str) -> Optional[Listing]:
        """Parst einen einzelnen MyHammer-Auftrag."""
        try:
            # Titel
            titel_elem = element.select_one(
                "h2 a, h3 a, .job-title a, .auction-title a, "
                "[data-testid='job-title']"
            )
            if not titel_elem:
                return None

            titel = titel_elem.get_text(strip=True)
            link = titel_elem.get("href", "")
            if link and not link.startswith("http"):
                link = f"{basis_url}{link}"

            if not link:
                return None

            # Beschreibung
            beschreibung = ""
            desc_elem = element.select_one(
                ".job-description, .auction-description, "
                "[data-testid='job-description'], p"
            )
            if desc_elem:
                beschreibung = desc_elem.get_text(strip=True)

            # Ort
            ort = ""
            ort_elem = element.select_one(
                ".job-location, .auction-location, "
                "[data-testid='job-location'], .location"
            )
            if ort_elem:
                ort = ort_elem.get_text(strip=True)

            # Budget / Preis
            preis = None
            preis_elem = element.select_one(
                ".job-budget, .auction-budget, .price, "
                "[data-testid='job-budget']"
            )
            if preis_elem:
                preis = preis_elem.get_text(strip=True)

            return Listing(
                url=link,
                titel=titel,
                beschreibung=beschreibung,
                ort=ort,
                quelle=Quelle.MYHAMMER,
                datum_gefunden=datetime.now(),
                preis=preis,
            )

        except Exception as e:
            self.logger.debug(f"Fehler beim Parsen eines MyHammer-Auftrags: {e}")
            return None
