"""Standort-Filter: Prüft ob ein Listing im Einzugsgebiet liegt."""

import re
from models import Listing
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.standort_filter")

# PLZ-Präfixe für das Einzugsgebiet (100 km um Heilbronn)
# Heilbronn: 74xxx
# Stuttgart: 70xxx, 71xxx
# Heidelberg/Mannheim: 69xxx
# Würzburg: 97xxx (teilweise)
# Schwäbisch Hall: 74xxx
ERLAUBTE_PLZ_PREFIXES = [
    "74",   # Heilbronn, Schwäbisch Hall, Crailsheim, Öhringen
    "70",   # Stuttgart
    "71",   # Ludwigsburg, Backnang
    "72",   # Tübingen, Reutlingen
    "69",   # Heidelberg, Mannheim
    "73",   # Göppingen, Aalen
]

# Ortsnamen die immer akzeptiert werden
ERLAUBTE_ORTSKEYWORDS = [
    "heilbronn", "neckarsulm", "weinsberg", "bad friedrichshall", "lauffen",
    "brackenheim", "öhringen", "neuenstadt", "eppingen", "gemmrigheim",
    "besigheim", "bietigheim", "ludwigsburg", "stuttgart", "heidelberg",
    "mannheim", "schwäbisch hall", "crailsheim", "künzelsau", "würzburg",
    "mosbach", "sinsheim", "heilbronn", "neckargemünd", "eppingen",
]


def ist_im_einzugsgebiet(listing: Listing, config: dict) -> tuple[bool, str]:
    """Prüft ob ein Listing im konfigurierten Einzugsgebiet liegt.

    Args:
        listing: Das zu prüfende Listing
        config: Konfiguration mit suchgebiet-Einstellungen

    Returns:
        Tuple aus (ist_im_gebiet, grund)
    """
    suchgebiet = config.get("suchgebiet", {})

    # Falls Suchgebiet deaktiviert, alles akzeptieren
    if not suchgebiet.get("aktiv", False):
        return True, "Suchgebiet deaktiviert"

    ort = listing.ort or ""
    ort_lower = ort.lower()

    # 1. Prüfe PLZ im Ortsstring
    plz_match = re.search(r'\b(\d{5})\b', ort)
    if plz_match:
        plz = plz_match.group(1)
        for prefix in ERLAUBTE_PLZ_PREFIXES:
            if plz.startswith(prefix):
                return True, f"PLZ {plz} im Einzugsgebiet"

    # 2. Prüfe Ortsnamen
    for keyword in ERLAUBTE_ORTSKEYWORDS:
        if keyword in ort_lower:
            return True, f"Ort '{keyword}' erkannt"

    # 3. Prüfe Regions-Keywords aus Config
    regionen = config.get("regionen", {})
    for region_name, region_data in regionen.items():
        keywords = region_data.get("keywords", [])
        for keyword in keywords:
            if keyword.lower() in ort_lower:
                return True, f"Region '{keyword}' erkannt"
        plz_prefixes = region_data.get("plz_prefixes", [])
        for prefix in plz_prefixes:
            if prefix in ort:
                return True, f"PLZ-Präfix '{prefix}' erkannt"

    # Nicht im Einzugsgebiet
    logger.debug(f"Standort außerhalb: {ort}")
    return False, f"Standort '{ort}' außerhalb des Einzugsgebiets"
