"""Parsing von Anzeigen-Datumsangaben (Kleinanzeigen etc.) und Alter-Filter."""

import re
from datetime import datetime, timedelta
from typing import Optional, Tuple

from models import Listing
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.date_parser")


def parse_inserat_datum(text: Optional[str]) -> Optional[datetime]:
    """
    Parst verschiedene Datumsformate aus Anzeigentexten.

    Unterstützte Formate:
    - "vor X Stunden/std./stunde"
    - "vor X Minuten/min."
    - "vor X Tagen/tagen"
    - "heute"
    - "gestern"
    - "DD.MM.YY" oder "DD.MM.YYYY"
    - "DD. Monat YYYY" (z.B. "15. Februar 2024")
    - "YYYY-MM-DD" (ISO)
    - "YYYY/MM/DD"

    Returns:
        datetime Objekt oder None wenn nicht parsebar
    """
    if not text or not isinstance(text, str):
        return None

    text = text.strip()
    now = datetime.now()

    # 1. "vor X Stunden/std./stunde"
    m = re.search(r"vor\s+(\d+)\s*(?:std\.?|stunden?)", text, re.I)
    if m:
        stunden = int(m.group(1))
        return now - timedelta(hours=stunden)

    # 2. "vor X Minuten/min."
    m = re.search(r"vor\s+(\d+)\s*(?:min\.?|minuten?)", text, re.I)
    if m:
        minuten = int(m.group(1))
        return now - timedelta(minutes=minuten)

    # 3. "vor X Tagen/tagen"
    m = re.search(r"vor\s+(\d+)\s*(?:t(?:agen?)?)", text, re.I)
    if m:
        tage = int(m.group(1))
        return now - timedelta(days=tage)

    # 4. "heute" mit Uhrzeit
    if re.search(r"heute", text, re.I):
        m = re.search(r"(\d{1,2})\s*:\s*(\d{2})", text)
        if m:
            h, mi = int(m.group(1)), int(m.group(2))
            return now.replace(hour=h, minute=mi, second=0, microsecond=0)
        return now

    # 5. "gestern" mit Uhrzeit
    if re.search(r"gestern", text, re.I):
        m = re.search(r"(\d{1,2})\s*:\s*(\d{2})", text)
        gestern = now - timedelta(days=1)
        if m:
            h, mi = int(m.group(1)), int(m.group(2))
            return gestern.replace(hour=h, minute=mi, second=0, microsecond=0)
        return gestern.replace(hour=12, minute=0, second=0, microsecond=0)

    # 6. DD.MM.YY oder DD.MM.YYYY
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})", text)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        try:
            return datetime(y, mo, d, 12, 0, 0)
        except ValueError as e:
            logger.warning(f"Ungültiges Datum DD.MM.YYYY: {text} -> {e}")

    # 7. YYYY-MM-DD (ISO)
    m = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return datetime(y, mo, d, 12, 0, 0)
        except ValueError as e:
            logger.warning(f"Ungültiges Datum YYYY-MM-DD: {text} -> {e}")

    # 8. YYYY/MM/DD
    m = re.search(r"(\d{4})/(\d{1,2})/(\d{1,2})", text)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return datetime(y, mo, d, 12, 0, 0)
        except ValueError as e:
            logger.warning(f"Ungültiges Datum YYYY/MM/DD: {text} -> {e}")

    # 9. DD. Monat YYYY (z.B. "15. Februar 2024")
    monate = {
        "januar": 1, "februar": 2, "märz": 3, "april": 4, "mai": 5, "juni": 6,
        "juli": 7, "august": 8, "september": 9, "oktober": 10, "november": 11, "dezember": 12
    }
    m = re.search(r"(\d{1,2})\.?\s+(" + "|".join(monate.keys()) + r")\s+(\d{4})", text, re.I)
    if m:
        d = int(m.group(1))
        monat_name = m.group(2).lower()
        y = int(m.group(3))
        if monat_name in monate:
            mo = monate[monat_name]
            try:
                return datetime(y, mo, d, 12, 0, 0)
            except ValueError as e:
                logger.warning(f"Ungültiges Datum DD. Monat YYYY: {text} -> {e}")

    # Warnung für nicht parsebares Datum
    logger.debug(f"Datum nicht parsebar: '{text}'")

    return None


def parse_inserat_datum_safe(text: Optional[str]) -> Tuple[Optional[datetime], bool, str]:
    """
    Sicheres Parsing mit Warnung bei Parse-Fehlern.

    Returns:
        (datetime_obj, success, warning_message)
    """
    parsed = parse_inserat_datum(text)
    if parsed is not None:
        return parsed, True, ""
    else:
        warning = f"Konnte Datum nicht parsen: '{text}'" if text else "Keine Datumsangabe"
        logger.warning(warning)
        return None, False, warning


def ist_nicht_aelter_als_stunden(listing: Listing, max_stunden: int) -> bool:
    """
    Prüft ob ein Listing nicht älter als max_stunden ist.

    Returns:
        True wenn Alter <= max_stunden oder max_stunden <= 0 (deaktiviert)
        False wenn Parsing fehlschlägt oder zu alt
    """
    if max_stunden <= 0:
        return True

    parsed = parse_inserat_datum(listing.datum_inserat)
    if parsed is None:
        logger.warning(f"Alter-Filter: Konnte Datum nicht parsen für '{listing.titel[:50]}': '{listing.datum_inserat}'")
        return False

    grenze = datetime.now() - timedelta(hours=max_stunden)
    alter_hours = (datetime.now() - parsed).total_seconds() / 3600

    ist_ok = parsed >= grenze
    logger.debug(f"Alter-Check: {alter_hours:.1f}h (Max: {max_stunden}h) -> {'OK' if ist_ok else 'AUSSCHLUSS'}")

    return ist_ok