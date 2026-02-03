"""Scoring-Engine: Bewertet Listings auf Relevanz (0-100)."""

from models import Listing, Kategorie, Prioritaet, Bewertungsergebnis
from filter.criteria import Criteria
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.scorer")


class Scorer:
    def __init__(self, config: dict):
        self.config = config
        self.criteria = Criteria(config)
        self.scoring_config = config.get("scoring", {})
        self.gewichtung = self.scoring_config.get("gewichtung", {})
        self.regionen = config.get("regionen", {})

    def bewerten(self, listing: Listing) -> Bewertungsergebnis:
        ausgeschlossen, grund = self.criteria.ist_ausgeschlossen(listing)
        if ausgeschlossen:
            logger.debug(f"Ausgeschlossen: {listing.titel[:50]} → {grund}")
            return Bewertungsergebnis(
                listing=listing,
                score_gesamt=0,
                score_region=0,
                score_leistung=0,
                score_qualitaet=0,
                kategorie=Kategorie.SONSTIGES,
                prioritaet=Prioritaet.ROT,
                ausgeschlossen=True,
                ausschluss_grund=grund,
            )
        kategorie = self.criteria.kategorie_erkennen(listing)
        score_region = self._score_region(listing)
        score_leistung = self._score_leistung(listing, kategorie)
        score_qualitaet = self._score_qualitaet(listing)
        score_gesamt = score_region + score_leistung + score_qualitaet
        gruen_min = self.scoring_config.get("gruen_min", 70)
        gelb_min = self.scoring_config.get("gelb_min", 40)
        if score_gesamt >= gruen_min:
            prioritaet = Prioritaet.GRUEN
        elif score_gesamt >= gelb_min:
            prioritaet = Prioritaet.GELB
        else:
            prioritaet = Prioritaet.ROT
        ergebnis = Bewertungsergebnis(
            listing=listing,
            score_gesamt=score_gesamt,
            score_region=score_region,
            score_leistung=score_leistung,
            score_qualitaet=score_qualitaet,
            kategorie=kategorie,
            prioritaet=prioritaet,
        )
        logger.info(
            f"Score: {score_gesamt}/100 [{prioritaet.value}] "
            f"({score_region}R + {score_leistung}L + {score_qualitaet}Q) "
            f"→ {listing.titel[:50]}"
        )
        return ergebnis

    def _score_region(self, listing: Listing) -> int:
        max_punkte = self.gewichtung.get("region", 30)
        ort = listing.ort.lower()
        if not ort:
            return max_punkte // 3
        for region_name, region_data in self.regionen.items():
            region_score = region_data.get("score", 0)
            keywords = [kw.lower() for kw in region_data.get("keywords", [])]
            plz_prefixes = region_data.get("plz_prefixes", [])
            if any(kw in ort for kw in keywords):
                return region_score
            for prefix in plz_prefixes:
                if prefix in ort:
                    return region_score
        return 5

    def _score_leistung(self, listing: Listing, kategorie: Kategorie) -> int:
        max_punkte = self.gewichtung.get("leistung", 40)
        leistung_scores = {
            Kategorie.BODEN: max_punkte,
            Kategorie.MONTAGE: int(max_punkte * 0.875),
            Kategorie.UEBERGABE: int(max_punkte * 0.75),
            Kategorie.SONSTIGES: int(max_punkte * 0.375),
        }
        base_score = leistung_scores.get(kategorie, 15)
        text = f"{listing.titel} {listing.beschreibung}".lower()
        fitness_keywords = [
            "homegym", "power rack", "squat rack", "fitnessgerät",
            "kraftstation", "hantelbank", "laufband",
        ]
        if any(kw in text for kw in fitness_keywords):
            base_score = min(max_punkte, base_score + 5)
        if "übergabe" in text and ("boden" in text or "streichen" in text):
            base_score = min(max_punkte, base_score + 3)
        return base_score

    def _score_qualitaet(self, listing: Listing) -> int:
        score = 0
        if self.criteria.ist_privatkunde(listing):
            score += 10
        if self.criteria.hat_realistische_beschreibung(listing):
            score += 10
        if self.criteria.hat_dringlichkeit(listing):
            score += 10
        return score
