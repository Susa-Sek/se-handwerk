"""Scraper für markt.de – Kleinanzeigen / Gesuche."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper


# PLZ für Region (markt.de nutzt oft PLZ oder Stadt)
REGION_PLZ = {
    "Heilbronn": "74072",
    "Stuttgart": "70173",
    "Ludwigsburg": "71638",
}


class MarktScraper(BaseScraper):
    """Durchsucht markt.de nach Handwerks-Gesuchen."""

    @property
    def name(self) -> str:
        return "markt"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf markt.de. Gibt Liste von Listing zurück."""
        basis = self.config.get("markt", {}).get(
            "basis_url", "https://www.markt.de"
        )
        plz = REGION_PLZ.get(region, "74072")
        radius = self.config.get("markt", {}).get("radius_km", 100)
        encoded = quote_plus(suchbegriff)
        # Typische markt.de Such-URL (ggf. an echte Struktur anpassen)
        url = f"{basis}/kleinanzeigen/suche?q={encoded}&plz={plz}&radius={radius}"

        response = self._request(url)
        if not response:
            return []

        return self._parse_ergebnisse(response.text, suchbegriff)

    def _parse_ergebnisse(self, html: str, suchbegriff: str) -> list[Listing]:
        """HTML parsen, Liste von Listing-Objekten bauen."""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        for elem in soup.select(
            "article.ad, .listing-item, .search-result, "
            ".aditem, [data-ad-id], .result-item"
        ):
            listing = self._parse_einzel(elem)
            if listing:
                listings.append(listing)

        self.logger.debug(
            f"markt: {len(listings)} Listings für '{suchbegriff}'"
        )
        return listings

    def _parse_einzel(self, elem) -> Optional[Listing]:
        """Ein Suchergebnis in ein Listing umwandeln."""
        try:
            link = elem.select_one("a[href]")
            if not link:
                return None
            href = link.get("href", "")
            if href and not href.startswith("http"):
                basis = self.config.get("markt", {}).get(
                    "basis_url", "https://www.markt.de"
                )
                href = f"{basis.rstrip('/')}{href}"
            titel = link.get_text(strip=True) if link else ""
            if not titel:
                titel = elem.select_one("h2, h3, .title, .ad-title")
                titel = titel.get_text(strip=True) if titel else "Ohne Titel"

            beschreibung = ""
            desc = elem.select_one("p, .description, .content, .ad-description")
            if desc:
                beschreibung = desc.get_text(strip=True)[:2000]

            ort = ""
            loc = elem.select_one(".location, .ort, .place, [data-location]")
            if loc:
                ort = loc.get_text(strip=True)

            datum_inserat = None
            date_elem = elem.select_one("time, .date, .ad-date")
            if date_elem:
                datum_inserat = date_elem.get_text(strip=True)
            if date_elem and date_elem.get("datetime"):
                datum_inserat = date_elem.get("datetime")

            preis = None
            price_elem = elem.select_one(".price, .ad-price")
            if price_elem:
                preis = price_elem.get_text(strip=True)

            return Listing(
                url=href,
                titel=titel or "Ohne Titel",
                beschreibung=beschreibung,
                ort=ort,
                quelle=Quelle.MARKT,
                datum_gefunden=datetime.now(),
                datum_inserat=datum_inserat,
                preis=preis,
            )
        except Exception as e:
            self.logger.debug(f"markt Parse-Fehler: {e}")
            return None
