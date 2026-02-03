"""Scraper für nebenan.de – Nachbarschafts-Gesuche."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper


class NebenanScraper(BaseScraper):
    """Durchsucht nebenan.de nach Handwerks-Gesuchen in der Region."""

    @property
    def name(self) -> str:
        return "nebenan"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf nebenan.de. Gibt Liste von Listing zurück."""
        basis = self.config.get("nebenan", {}).get(
            "basis_url", "https://www.nebenan.de"
        )
        # Such-URL (nebenan.de Struktur kann sich ändern – ggf. anpassen)
        url = f"{basis}/gesuche?query={quote_plus(suchbegriff)}&location={quote_plus(region)}"

        response = self._request(url)
        if not response:
            return []

        return self._parse_ergebnisse(response.text, suchbegriff)

    def _parse_ergebnisse(self, html: str, suchbegriff: str) -> list[Listing]:
        """HTML parsen, Liste von Listing-Objekten bauen."""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        # Selektoren anpassen – nebenan.de nutzt verschiedene Strukturen
        # Typische Container: .post, .request-card, [data-testid="request-item"]
        for elem in soup.select(
            "article.post, .request-card, [data-testid='request-item'], "
            ".gesuch-item, .search-result-item"
        ):
            listing = self._parse_einzel(elem)
            if listing:
                listings.append(listing)

        self.logger.debug(
            f"nebenan: {len(listings)} Listings für '{suchbegriff}'"
        )
        return listings

    def _parse_einzel(self, elem) -> Optional[Listing]:
        """Ein Suchergebnis in ein Listing umwandeln."""
        try:
            link = elem.select_one("a[href*='/gesuche/'], a[href*='/request/'], a[href]")
            if not link:
                return None
            href = link.get("href", "")
            if href and not href.startswith("http"):
                basis = self.config.get("nebenan", {}).get(
                    "basis_url", "https://www.nebenan.de"
                )
                href = f"{basis.rstrip('/')}{href}"
            titel = link.get_text(strip=True) if link else ""
            if not titel:
                titel = elem.select_one("h2, h3, .title")
                titel = titel.get_text(strip=True) if titel else "Ohne Titel"

            beschreibung = ""
            desc = elem.select_one("p, .description, .content, .text")
            if desc:
                beschreibung = desc.get_text(strip=True)[:2000]

            ort = ""
            loc = elem.select_one("[data-location], .location, .ort, .place")
            if loc:
                ort = loc.get_text(strip=True)

            datum_inserat = None
            date_elem = elem.select_one("time, .date, .time")
            if date_elem:
                datum_inserat = date_elem.get_text(strip=True)
            if date_elem and date_elem.get("datetime"):
                datum_inserat = date_elem.get("datetime")

            return Listing(
                url=href,
                titel=titel or "Ohne Titel",
                beschreibung=beschreibung,
                ort=ort,
                quelle=Quelle.NEBENAN,
                datum_gefunden=datetime.now(),
                datum_inserat=datum_inserat,
            )
        except Exception as e:
            self.logger.debug(f"nebenan Parse-Fehler: {e}")
            return None
