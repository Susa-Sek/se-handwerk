"""Scraper für Kleinanzeigen.de – Hauptquelle für Aufträge."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper


# PLZ-Codes für Regionen (Kleinanzeigen nutzt PLZ + Radius)
REGION_PLZ = {
    "Heilbronn": "74072",
    "Stuttgart": "70173",
    "Ludwigsburg": "71638",
    "Mannheim": "68159",
    "Sachsenheim": "74343",
}


class KleinanzeigenScraper(BaseScraper):
    """Durchsucht Kleinanzeigen.de nach Handwerks-Gesuchen."""

    @property
    def name(self) -> str:
        return "kleinanzeigen"

    def _build_url(self, suchbegriff: str, plz: str, radius_km: int = 50) -> str:
        """Baut die Such-URL für Kleinanzeigen."""
        basis = self.config.get("kleinanzeigen", {}).get(
            "basis_url", "https://www.kleinanzeigen.de"
        )
        encoded = quote_plus(suchbegriff)
        return f"{basis}/s-{plz}/anzeige:gesuche/{encoded}/k0r{radius_km}"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf Kleinanzeigen nach Gesuchen (nur Heilbronn + Radius 100 km)."""
        plz = REGION_PLZ.get(region, "74072")
        # Radius: suchgebiet (100 km) oder kleinanzeigen.radius_km
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
        """Parst die Suchergebnisse-Seite."""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        # Kleinanzeigen Listing-Container
        artikel_liste = soup.select("article.aditem")
        if not artikel_liste:
            # Alternativer Selektor
            artikel_liste = soup.select("li.ad-listitem article")

        for artikel in artikel_liste:
            listing = self._parse_einzelnes_listing(artikel)
            if listing:
                listings.append(listing)

        self.logger.debug(
            f"Kleinanzeigen: {len(listings)} Listings geparst für '{suchbegriff}'"
        )
        return listings

    def _parse_einzelnes_listing(self, artikel) -> Optional[Listing]:
        """Parst ein einzelnes Listing aus dem HTML."""
        try:
            # Titel
            titel_elem = artikel.select_one(
                "a.ellipsis, h2.text-module-begin a, [data-testid='ad-title']"
            )
            if not titel_elem:
                return None
            titel = titel_elem.get_text(strip=True)

            # URL
            link = titel_elem.get("href", "")
            if link and not link.startswith("http"):
                basis = self.config.get("kleinanzeigen", {}).get(
                    "basis_url", "https://www.kleinanzeigen.de"
                )
                link = f"{basis}{link}"

            if not link:
                return None

            # Beschreibung
            beschreibung_elem = artikel.select_one(
                "p.aditem-main--middle--description, "
                "[data-testid='ad-description']"
            )
            beschreibung = ""
            if beschreibung_elem:
                beschreibung = beschreibung_elem.get_text(strip=True)

            # Ort
            ort_elem = artikel.select_one(
                ".aditem-main--top--left, "
                "[data-testid='ad-location']"
            )
            ort = ""
            if ort_elem:
                ort = ort_elem.get_text(strip=True)

            # Preis
            preis_elem = artikel.select_one(
                ".aditem-main--middle--price-shipping--price, "
                "[data-testid='ad-price']"
            )
            preis = None
            if preis_elem:
                preis = preis_elem.get_text(strip=True)

            # Datum
            datum_elem = artikel.select_one(
                ".aditem-main--top--right, "
                "[data-testid='ad-date']"
            )
            datum_inserat = None
            if datum_elem:
                datum_inserat = datum_elem.get_text(strip=True)

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
