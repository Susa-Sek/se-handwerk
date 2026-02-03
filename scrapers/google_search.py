"""Google-Suche nach lokalen Handwerks-Gesuchen."""

from datetime import datetime
from typing import Optional

from models import Listing, Quelle
from scrapers.base import BaseScraper

try:
    from googlesearch import search as google_search
except ImportError:
    google_search = None


class GoogleScraper(BaseScraper):
    """Durchsucht Google nach lokalen Handwerker-Gesuchen."""

    @property
    def name(self) -> str:
        return "google"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf Google nach Gesuchen."""
        if google_search is None:
            self.logger.error(
                "googlesearch-python nicht installiert. "
                "Bitte installieren: pip install googlesearch-python"
            )
            return []

        google_config = self.config.get("google", {})
        max_results = google_config.get("max_results", 10)
        site_filter = google_config.get("site_filter", [])

        listings = []

        # Suche mit Site-Filter
        if site_filter:
            site_query = " OR ".join(f"site:{s}" for s in site_filter)
            query = f'"{suchbegriff}" {region} ({site_query})'
        else:
            query = f'"{suchbegriff}" {region} gesucht'

        self.logger.debug(f"Google-Query: {query}")

        try:
            results = google_search(
                query,
                num_results=max_results,
                lang="de",
                region="de",
            )

            for url in results:
                listing = self._url_zu_listing(url, suchbegriff, region)
                if listing:
                    listings.append(listing)

        except Exception as e:
            self.logger.error(f"Google-Suche fehlgeschlagen: {e}")

        return listings

    def _url_zu_listing(
        self, url: str, suchbegriff: str, region: str
    ) -> Optional[Listing]:
        """Erstellt ein Listing aus einer Google-Ergebnis-URL."""
        # Bekannte irrelevante URLs filtern
        skip_domains = [
            "youtube.com", "wikipedia.org", "amazon.",
            "ebay.", "pinterest.", "instagram.",
        ]
        if any(domain in url.lower() for domain in skip_domains):
            return None

        # Seite abrufen und Titel extrahieren
        response = self._request(url)
        if not response:
            return Listing(
                url=url,
                titel=f"{suchbegriff} in {region}",
                beschreibung="",
                ort=region,
                quelle=Quelle.GOOGLE,
                datum_gefunden=datetime.now(),
            )

        # Titel aus HTML extrahieren
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(response.text, "html.parser")

        titel = suchbegriff
        title_tag = soup.find("title")
        if title_tag:
            titel = title_tag.get_text(strip=True)[:200]

        # Beschreibung aus Meta-Description oder erstem Textblock
        beschreibung = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            beschreibung = meta_desc["content"][:500]
        else:
            # Erster sichtbarer Textblock
            for tag in soup.find_all(["p", "div"], limit=5):
                text = tag.get_text(strip=True)
                if len(text) > 50:
                    beschreibung = text[:500]
                    break

        return Listing(
            url=url,
            titel=titel,
            beschreibung=beschreibung,
            ort=region,
            quelle=Quelle.GOOGLE,
            datum_gefunden=datetime.now(),
        )
