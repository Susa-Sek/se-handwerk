"""Parsing von Anzeigen-Datumsangaben (Kleinanzeigen etc.) und Alter-Filter."""

import re
from datetime import datetime, timedelta
from typing import Optional

from models import Listing


def parse_inserat_datum(text: Optional[str]) -> Optional[datetime]:
    """
    Parst typische deutsche Datumsangaben von Kleinanzeigen.
    Beispiele: "Heute, 14:30", "Gestern, 09:00", "Vor 2 Std.", "25.01.2025"
    Gibt None zurück, wenn nicht parsbar.
    """
    if not text or not isinstance(text, str):
        return None
    text = text.strip()
    now = datetime.now()

    # "Vor X Std." / "Vor X Stunden"
    m = re.search(r"vor\s+(\d+)\s*(?:std\.?|stunden?)", text, re.I)
    if m:
        stunden = int(m.group(1))
        return now - timedelta(hours=stunden)

    # "Heute, 14:30" / "Heute 14:30"
    if re.search(r"heute", text, re.I):
        m = re.search(r"(\d{1,2})\s*:\s*(\d{2})", text)
        if m:
            h, mi = int(m.group(1)), int(m.group(2))
            return now.replace(hour=h, minute=mi, second=0, microsecond=0)
        return now  # "Heute" ohne Uhrzeit = jetzt

    # "Gestern, 09:00"
    if re.search(r"gestern", text, re.I):
        m = re.search(r"(\d{1,2})\s*:\s*(\d{2})", text)
        gestern = now - timedelta(days=1)
        if m:
            h, mi = int(m.group(1)), int(m.group(2))
            return gestern.replace(hour=h, minute=mi, second=0, microsecond=0)
        return gestern.replace(hour=12, minute=0, second=0, microsecond=0)

    # "25.01.2025" oder "25.01.25"
    m = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})", text)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if y < 100:
            y += 2000
        try:
            return datetime(y, mo, d, 12, 0, 0)
        except ValueError:
            return None

    return None


def ist_nicht_aelter_als_stunden(listing: Listing, max_stunden: int) -> bool:
    """
    True, wenn die Anzeige nicht älter als max_stunden ist.
    Wenn datum_inserat nicht parsbar ist: Anzeige wird aus Sicherheit
    ausgeschlossen (nur frische Anzeigen zulassen).
    """
    if max_stunden <= 0:
        return True
    parsed = parse_inserat_datum(listing.datum_inserat)
    if parsed is None:
        return False
    grenze = datetime.now() - timedelta(hours=max_stunden)
    return parsed >= grenze
