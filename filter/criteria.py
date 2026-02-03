"""Ausschlusskriterien und Filterlogik basierend auf dem Master-Prompt."""

import re
from typing import Optional

from models import Listing, Kategorie
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.criteria")


class Criteria:
    """Prüft Listings gegen Ausschlusskriterien und klassifiziert Kategorien."""

    def __init__(self, config: dict):
        self.config = config
        ausschluesse = config.get("ausschluesse", {})
        self._ausschluss_leistungen = [
            s.lower() for s in ausschluesse.get("leistungen", [])
        ]
        self._ausschluss_billig = [
            s.lower() for s in ausschluesse.get("begriffe_billig", [])
        ]
        self._suchbegriffe = config.get("suchbegriffe", {})

    def ist_ausgeschlossen(self, listing: Listing) -> tuple[bool, Optional[str]]:
        """Prüft ob ein Listing ausgeschlossen werden soll.

        Returns:
            (ausgeschlossen: bool, grund: Optional[str])
        """
        text = f"{listing.titel} {listing.beschreibung}".lower()

        # Ausschluss nach Leistung
        for ausschluss in self._ausschluss_leistungen:
            if ausschluss in text:
                return True, f"Ausgeschlossene Leistung: {ausschluss}"

        # Ausschluss nach Billig-Begriffen
        for billig in self._ausschluss_billig:
            if billig in text:
                return True, f"Billig-Anfrage: {billig}"

        # Ausschluss: Region außerhalb BW (nur wenn Ort klar nicht in BW)
        bw_indikatoren = [
            "heilbronn", "stuttgart", "ludwigsburg", "mannheim",
            "heidelberg", "karlsruhe", "freiburg", "ulm", "tübingen",
            "reutlingen", "esslingen", "pforzheim", "baden",
            "württemberg", "sachsenheim", "neckarsulm", "weinsberg",
        ]
        ort_lower = listing.ort.lower()
        if ort_lower and not any(ind in ort_lower for ind in bw_indikatoren):
            # Nur ausschließen wenn Ort klar woanders ist
            nicht_bw = [
                "berlin", "hamburg", "münchen", "köln", "frankfurt",
                "düsseldorf", "dortmund", "essen", "bremen", "dresden",
                "leipzig", "hannover", "nürnberg",
            ]
            for stadt in nicht_bw:
                if stadt in ort_lower:
                    return True, f"Region außerhalb BW: {listing.ort}"

        return False, None

    def kategorie_erkennen(self, listing: Listing) -> Kategorie:
        """Erkennt die Leistungskategorie eines Listings."""
        text = f"{listing.titel} {listing.beschreibung}".lower()

        # Boden-Keywords zählen
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
        """Zählt wie viele Keywords einer Kategorie im Text vorkommen."""
        keywords = self._suchbegriffe.get(kategorie_key, [])
        count = 0
        for kw in keywords:
            if kw.lower() in text:
                count += 1
        return count

    def ist_privatkunde(self, listing: Listing) -> bool:
        """Schätzt ob es sich um einen Privatkunden handelt."""
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
        """Prüft ob Dringlichkeit erkennbar ist."""
        text = f"{listing.titel} {listing.beschreibung}".lower()

        dringend_keywords = [
            "dringend", "schnell", "asap", "sofort", "diese woche",
            "kurzfristig", "eilig", "notfall", "baldmöglichst",
            "zeitnah", "nächste woche",
        ]
        return any(kw in text for kw in dringend_keywords)

    def hat_realistische_beschreibung(self, listing: Listing) -> bool:
        """Prüft ob die Beschreibung realistisch/detailliert genug ist."""
        text = listing.beschreibung

        # Mindestlänge
        if len(text) < 20:
            return False

        # Enthält Flächenangabe oder Raumangabe
        flaeche_pattern = r"\d+\s*m[²2]|\d+\s*qm|\d+\s*quadrat"
        raum_pattern = r"\d+\s*zimmer|\d+\s*räume|\d+\s*raum"

        if re.search(flaeche_pattern, text.lower()):
            return True
        if re.search(raum_pattern, text.lower()):
            return True

        # Mindestens 50 Zeichen Beschreibung
        return len(text) >= 50
