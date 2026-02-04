"""Ausschlusskriterien und Filterlogik."""

import re
from typing import Optional

from models import Listing, Kategorie
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.criteria")


class Criteria:
    def __init__(self, config: dict):
        self.config = config
        ausschluesse = config.get("ausschluesse", {})
        self._ausschluss_leistungen = [s.lower() for s in ausschluesse.get("leistungen", [])]
        self._ausschluss_billig = [s.lower() for s in ausschluesse.get("begriffe_billig", [])]
        self._suchbegriffe = config.get("suchbegriffe", {})

    def ist_ausgeschlossen(self, listing: Listing) -> tuple[bool, Optional[str]]:
        text = f"{listing.titel} {listing.beschreibung}".lower()
        for ausschluss in self._ausschluss_leistungen:
            if ausschluss in text:
                return True, f"Ausgeschlossene Leistung: {ausschluss}"
        for billig in self._ausschluss_billig:
            if billig in text:
                return True, f"Billig-Anfrage: {billig}"
        ort_lower = listing.ort.lower()
        if not ort_lower:
            return False, None

        # Städte/Regionen im 100km-Umkreis um Heilbronn
        im_umkreis_100km = [
            # Kernregion (0-30km)
            "heilbronn", "neckarsulm", "weinsberg", "bad friedrichshall",
            "lauffen", "brackenheim", "öhringen", "neuenstadt",
            "bad rappenau", "eppingen", "schwaigern", "obersulm",
            "erlenbach", "gundelsheim", "möckmühl", "bad wimpfen",
            "jagsthausen", "widdern", "langenbrettach", "untergruppenbach",
            "abstatt", "beilstein", "ilsfeld", "talheim", "flein",
            "leingarten", "nordheim", "cleebronn",
            # 30-70km
            "stuttgart", "ludwigsburg", "schwäbisch hall", "crailsheim",
            "esslingen", "waiblingen", "fellbach", "leonberg",
            "kornwestheim", "bietigheim", "sachsenheim", "vaihingen",
            "mühlacker", "bretten", "künzelsau", "gaildorf",
            "backnang", "winnenden", "schorndorf", "marbach",
            "böblingen", "sindelfingen", "mosbach", "sinsheim",
            # 70-100km
            "heidelberg", "mannheim", "karlsruhe", "pforzheim",
            "schwäbisch gmünd", "aalen", "ellwangen",
            "würzburg", "tauberbischofsheim", "wertheim",
            "göppingen", "kirchheim", "nürtingen",
        ]

        # Harter Ausschluss: Städte die definitiv zu weit weg sind
        zu_weit_weg = [
            # Andere Bundesländer
            "berlin", "hamburg", "münchen", "köln", "frankfurt",
            "düsseldorf", "dortmund", "essen", "bremen", "dresden",
            "leipzig", "hannover", "nürnberg", "rostock", "kiel",
            "lübeck", "potsdam", "erfurt", "magdeburg", "saarbrücken",
            "mainz", "wiesbaden", "kassel", "braunschweig", "bielefeld",
            "münster", "augsburg", "regensburg", "chemnitz", "halle",
            "bochum", "duisburg", "bonn", "aachen", "krefeld",
            "mönchengladbach", "gelsenkirchen", "oberhausen",
            # BW aber >100km von Heilbronn
            "freiburg", "konstanz", "ulm", "friedrichshafen",
            "ravensburg", "tuttlingen", "villingen", "donaueschingen",
            "rottweil", "offenburg", "lahr", "lörrach", "waldshut",
            "sigmaringen", "biberach",
        ]

        for stadt in zu_weit_weg:
            if stadt in ort_lower:
                return True, f"Zu weit entfernt (>100km): {listing.ort}"

        # Wenn Ort bekannt und im Umkreis → OK
        if any(ind in ort_lower for ind in im_umkreis_100km):
            return False, None

        # PLZ-Check: 74xxx (Heilbronn), 70-71xxx (Stuttgart/LB), 69xxx (HD/MA)
        import re
        plz_match = re.search(r'\b(\d{5})\b', ort_lower)
        if plz_match:
            plz = plz_match.group(1)
            erlaubte_prefixe = ["74", "70", "71", "69", "68", "75", "72", "73"]
            if plz[:2] in erlaubte_prefixe:
                return False, None
            return True, f"PLZ außerhalb Einzugsgebiet: {plz} ({listing.ort})"

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
