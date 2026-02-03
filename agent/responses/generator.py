"""Antwortvorschläge für Listings."""

from models import Bewertungsergebnis, Kategorie
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.responses")

FIRMA_NAME = "SE Handwerk"


class ResponseGenerator:
    def __init__(self, config: dict):
        self.config = config

    def generieren(self, ergebnis: Bewertungsergebnis) -> str:
        return _generieren(ergebnis)


def _generieren(ergebnis: Bewertungsergebnis) -> str:
    """Erzeugt einen Antwortvorschlag für ein Bewertungsergebnis."""
    k = ergebnis.kategorie
    text = (ergebnis.listing.titel + " " + ergebnis.listing.beschreibung).lower()
    dringend = any(kw in text for kw in ["dringend", "schnell", "sofort", "kurzfristig", "eilig"])
    if k == Kategorie.BODEN:
        template = "boden/entfernung" if dringend else "boden/standard"
    elif k == Kategorie.MONTAGE:
        template = "montage/standard"
    elif k == Kategorie.UEBERGABE:
        template = "uebergabe/standard"
    else:
        template = "sonstiges/standard"

    logger.debug(f"Template: {template} für '{ergebnis.listing.titel[:50]}'")

    # Einfache Templates
    templates = {
        "boden/standard": (
            f"Hallo, wir sind {FIRMA_NAME} aus der Region Heilbronn und verlegen Laminat, Vinyl und Klickboden. "
            "Gern erstellen wir Ihnen ein unverbindliches Angebot. Bei Interesse einfach melden."
        ),
        "boden/entfernung": (
            f"Hallo, wir sind {FIRMA_NAME} und unterstützen Sie kurzfristig beim Verlegen von Laminat/Vinyl. "
            "Region Heilbronn und Umgebung. Melden Sie sich gern."
        ),
        "montage/standard": (
            f"Hallo, wir sind {FIRMA_NAME} und übernehmen Möbel- und Gerätemontage (u.a. IKEA, Homegym). "
            "Region Heilbronn. Gern Angebot auf Anfrage."
        ),
        "uebergabe/standard": (
            f"Hallo, wir sind {FIRMA_NAME} und unterstützen bei Übergaberenovierung, Streichen und Boden. "
            "Region Heilbronn. Gern melden für ein Angebot."
        ),
        "sonstiges/standard": (
            f"Hallo, wir sind {FIRMA_NAME} aus Heilbronn – Boden, Montage, Übergabe. "
            "Bei Bedarf gern melden für ein unverbindliches Angebot."
        ),
    }
    return templates.get(template, templates["sonstiges/standard"])


def generieren(ergebnis: Bewertungsergebnis) -> str:
    return _generieren(ergebnis)
