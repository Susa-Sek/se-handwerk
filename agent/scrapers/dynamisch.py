"""Generischer Scraper der aus DB-Konfiguration arbeitet (CSS-Selektoren)."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.scraper.dynamisch")


class DynamischScraper(BaseScraper):
    """Generischer Scraper, konfiguriert über Plattform-Daten aus der Datenbank.

    Erwartet plattform_config mit folgender Struktur:
    {
        "name": "plattformname",
        "basis_url": "https://example.de",
        "scraper_config": {
            "such_url_template": "{basis_url}/suche?q={suchbegriff}&ort={region}",
            "selektoren": {
                "container": "div.search-result",
                "titel": "h3 a",
                "link": "h3 a[href]",
                "beschreibung": "p.description",
                "ort": ".location",
                "datum": "time"
            }
        }
    }
    """

    def __init__(self, config: dict, plattform_config: dict):
        self._plattform_name = plattform_config.get("name", "dynamisch")
        self._basis_url = plattform_config.get("basis_url", "")
        self._scraper_conf = plattform_config.get("scraper_config", {})
        if isinstance(self._scraper_conf, str):
            import json
            try:
                self._scraper_conf = json.loads(self._scraper_conf)
            except (json.JSONDecodeError, TypeError):
                self._scraper_conf = {}
        self._selektoren = self._scraper_conf.get("selektoren", {})
        self._such_url_template = self._scraper_conf.get("such_url_template", "")
        super().__init__(config)

    @property
    def name(self) -> str:
        return f"dynamisch:{self._plattform_name}"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf der konfigurierten Plattform."""
        url = self._build_such_url(suchbegriff, region)
        if not url:
            self.logger.warning(f"Keine Such-URL konfiguriert für {self._plattform_name}")
            return []

        response = self._request(url)
        if not response:
            return []

        return self._parse_ergebnisse(response.text, suchbegriff)

    def _build_such_url(self, suchbegriff: str, region: str) -> str:
        """Baut die Such-URL aus dem Template."""
        if not self._such_url_template:
            return ""

        try:
            return self._such_url_template.format(
                basis_url=self._basis_url.rstrip("/"),
                suchbegriff=quote_plus(suchbegriff),
                region=quote_plus(region),
            )
        except (KeyError, ValueError) as e:
            self.logger.error(f"Fehler beim URL-Template: {e}")
            return ""

    def _parse_ergebnisse(self, html: str, suchbegriff: str = "") -> list[Listing]:
        """Parst HTML mit konfigurierten CSS-Selektoren."""
        if not self._selektoren:
            self.logger.warning("Keine Selektoren konfiguriert")
            return []

        soup = BeautifulSoup(html, "html.parser")
        container_sel = self._selektoren.get("container", "")
        if not container_sel:
            self.logger.warning("Kein Container-Selektor konfiguriert")
            return []

        container = soup.select(container_sel)
        listings = []

        for element in container:
            try:
                listing = self._element_zu_listing(element)
                if listing:
                    listings.append(listing)
            except Exception as e:
                self.logger.debug(f"Fehler beim Parsen eines Elements: {e}")

        self.logger.info(
            f"{self._plattform_name}: {len(listings)} Ergebnisse geparst"
        )
        return listings

    def _element_zu_listing(self, element) -> Optional[Listing]:
        """Konvertiert ein HTML-Element in ein Listing."""
        titel_sel = self._selektoren.get("titel", "")
        link_sel = self._selektoren.get("link", "")
        beschreibung_sel = self._selektoren.get("beschreibung", "")
        ort_sel = self._selektoren.get("ort", "")

        # Titel extrahieren
        titel = ""
        if titel_sel:
            el = element.select_one(titel_sel)
            if el:
                titel = el.get_text(strip=True)

        if not titel:
            return None

        # Link extrahieren
        url = ""
        if link_sel:
            el = element.select_one(link_sel)
            if el:
                href = el.get("href", "")
                if href:
                    url = urljoin(self._basis_url, href)

        if not url:
            return None

        # Beschreibung extrahieren
        beschreibung = ""
        if beschreibung_sel:
            el = element.select_one(beschreibung_sel)
            if el:
                beschreibung = el.get_text(strip=True)

        # Ort extrahieren
        ort = ""
        if ort_sel:
            el = element.select_one(ort_sel)
            if el:
                ort = el.get_text(strip=True)

        return Listing(
            url=url,
            titel=titel,
            beschreibung=beschreibung,
            ort=ort,
            quelle=Quelle.DYNAMISCH,
            datum_gefunden=datetime.now(),
            rohdaten={"plattform_name": self._plattform_name},
        )
