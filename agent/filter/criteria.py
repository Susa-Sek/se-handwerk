"""Ausschlusskriterien und Filterlogik."""

import re
from typing import Optional

from models import Listing, Kategorie
from utils.logger import setup_logger
from utils.geo_distance import GeoDistanceFilter

logger = setup_logger("se_handwerk.criteria")


class Criteria:
    def __init__(self, config: dict):
        self.config = config
        ausschluesse = config.get("ausschluesse", {})
        self._ausschluss_leistungen = [s.lower() for s in ausschluesse.get("leistungen", [])]
        self._ausschluss_billig = [s.lower() for s in ausschluesse.get("begriffe_billig", [])]
        self._suchbegriffe = config.get("suchbegriffe", {})

        # Geo-Distanz-Filter initialisieren
        self.geo_filter = GeoDistanceFilter(config)

    def ist_ausgeschlossen(self, listing: Listing) -> tuple[bool, Optional[str]]:
        text = f"{listing.titel} {listing.beschreibung}".lower()
        for ausschluss in self._ausschluss_leistungen:
            if ausschluss in text:
                return True, f"Ausgeschlossene Leistung: {ausschluss}"
        for billig in self._ausschluss_billig:
            if billig in text:
                return True, f"Billig-Anfrage: {billig}"

        if not listing.ort:
            return False, None

        # Geo-Distanz-Filtering mit Nominatim API
        im_radius, distanz, grund = self.geo_filter.ist_im_radius(listing.ort)
        if not im_radius and grund:
            return True, grund

        return False, None

    def kategorie_erkennen(self, listing: Listing) -> Kategorie:
        text = f"{listing.titel} {listing.beschreibung}".lower()
        boden_score = self._keyword_match_count(text, "boden")
        montage_score = self._keyword_match_count(text, "montage")
        uebergabe_score = self._keyword_match_count(text, "uebergabe")
        scores = {
            Kategorie.BODEN: boden_score,
            Kategorie.MONTAGE: montage_score,
            Kategorie.UEBERGABE: uebergabe_score,
        }
        best = max(scores, key=scores.get)
        if scores[best] > 0:
            return best
        return Kategorie.SONSTIGES

    def _keyword_match_count(self, text: str, kategorie_key: str) -> int:
        keywords = self._suchbegriffe.get(kategorie_key, [])
        count = 0
        for kw in keywords:
            if kw.lower() in text:
                count += 1
        return count

    def ist_privatkunde(self, listing: Listing) -> bool:
        text = f"{listing.titel} {listing.beschreibung}".lower()
        gewerblich_indikatoren = [
            "firma", "gmbh", "ag ", "gbr", "unternehmen",
            "gewerbe", "gewerblich", "großauftrag", "serie",
        ]
        for ind in gewerblich_indikatoren:
            if ind in text:
                return False
        return True

    def hat_dringlichkeit(self, listing: Listing) -> bool:
        text = f"{listing.titel} {listing.beschreibung}".lower()
        dringend_keywords = [
            "dringend", "schnell", "asap", "sofort", "diese woche",
            "kurzfristig", "eilig", "notfall", "baldmöglichst",
            "zeitnah", "nächste woche",
        ]
        return any(kw in text for kw in dringend_keywords)

    def hat_realistische_beschreibung(self, listing: Listing) -> bool:
        text = listing.beschreibung
        if len(text) < 20:
            return False
        flaeche_pattern = r"\d+\s*m[²2]|\d+\s*qm|\d+\s*quadrat"
        raum_pattern = r"\d+\s*zimmer|\d+\s*räume|\d+\s*raum"
        if re.search(flaeche_pattern, text.lower()):
            return True
        if re.search(raum_pattern, text.lower()):
            return True
        return len(text) >= 50
