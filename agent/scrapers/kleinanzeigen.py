"""Scraper für Kleinanzeigen.de – Hauptquelle für Aufträge."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper

REGION_PLZ = {
    "Heilbronn": "74072",
    "Stuttgart": "70173",
    "Ludwigsburg": "71638",
    "Mannheim": "68159",
    "Sachsenheim": "74343",
}


class KleinanzeigenScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "kleinanzeigen"

    def _build_url(self, suchbegriff: str, plz: str, radius_km: int = 50) -> str:
        basis = self.config.get("kleinanzeigen", {}).get("basis_url", "https://www.kleinanzeigen.de")
        encoded = quote_plus(suchbegriff)
        return f"{basis}/s-{plz}/anzeige:gesuche/{encoded}/k0r{radius_km}"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        plz = REGION_PLZ.get(region, "74072")
        radius = (
            self.config.get("suchgebiet", {}).get("radius_km")
            or self.config.get("kleinanzeigen", {}).get("radius_km", 100)
        )
        url = self._build_url(suchbegriff, plz, radius)
        response = self._request(url)
        if not response:
            return []
        return self._parse_ergebnisse(response.text, suchbegriff)

    def _parse_ergebnisse(self, html: str, suchbegriff: str) -> list[Listing]:
        soup = BeautifulSoup(html, "html.parser")
        listings = []
        for artikel in soup.select("article.aditem") or soup.select("li.ad-listitem article"):
            listing = self._parse_einzel(artikel)
            if listing:
                listings.append(listing)
        self.logger.debug(f"Kleinanzeigen: {len(listings)} Listings geparst für '{suchbegriff}'")
        return listings

    def _parse_einzel(self, artikel) -> Optional[Listing]:
        try:
            titel_elem = artikel.select_one("a.ellipsis, h2.text-module-begin a, [data-testid='ad-title']")
            if not titel_elem:
                return None
            titel = titel_elem.get_text(strip=True)
            link = titel_elem.get("href", "")
            if link and not link.startswith("http"):
                basis = self.config.get("kleinanzeigen", {}).get("basis_url", "https://www.kleinanzeigen.de")
                link = f"{basis}{link}"
            if not link:
                return None
            beschreibung_elem = artikel.select_one("p.aditem-main--middle--description, [data-testid='ad-description']")
            beschreibung = beschreibung_elem.get_text(strip=True) if beschreibung_elem else ""
            ort_elem = artikel.select_one(".aditem-main--top--left, [data-testid='ad-location']")
            ort = ort_elem.get_text(strip=True) if ort_elem else ""
            preis_elem = artikel.select_one(".aditem-main--middle--price-shipping--price, [data-testid='ad-price']")
            preis = preis_elem.get_text(strip=True) if preis_elem else None
            datum_elem = artikel.select_one(".aditem-main--top--right, [data-testid='ad-date']")
            datum_inserat = datum_elem.get_text(strip=True) if datum_elem else None
            return Listing(
                url=link,
                titel=titel,
                beschreibung=beschreibung,
                ort=ort,
                quelle=Quelle.KLEINANZEIGEN,
                datum_gefunden=datetime.now(),
                datum_inserat=datum_inserat,
                preis=preis,
            )
        except Exception as e:
            self.logger.debug(f"Fehler beim Parsen eines Listings: {e}")
            return None
