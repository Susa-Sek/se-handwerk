"""Extrahiert E-Mail-Adressen aus Listing-Feldern."""

import re
from typing import Optional

from models import Listing
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.outreach.extraktor")

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')


class KontaktExtraktor:
    """Sucht E-Mail-Adressen in Listing-Feldern (kontakt → titel → beschreibung)."""

    def extrahieren(self, listing: Listing) -> Optional[str]:
        """Gibt die erste gefundene E-Mail-Adresse zurück (lowercase) oder None."""
        for text in [listing.kontakt, listing.titel, listing.beschreibung]:
            if not text:
                continue
            m = EMAIL_REGEX.search(text)
            if m:
                email = m.group(0).lower()
                logger.debug(f"E-Mail gefunden in '{listing.titel[:40]}': {email}")
                return email
        return None
