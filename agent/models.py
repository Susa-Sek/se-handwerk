"""Datenmodelle für SE Handwerk Akquise-Agent."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Quelle(Enum):
    KLEINANZEIGEN = "kleinanzeigen"
    MYHAMMER = "myhammer"
    GOOGLE = "google"
    FACEBOOK = "facebook"
    NEBENAN = "nebenan"
    MARKT = "markt"
    DYNAMISCH = "dynamisch"


class Kategorie(Enum):
    BODEN = "boden"
    MONTAGE = "montage"
    UEBERGABE = "uebergabe"
    SONSTIGES = "sonstiges"


class Prioritaet(Enum):
    GRUEN = "gruen"    # Score >= 70
    GELB = "gelb"      # Score 40-69
    ROT = "rot"        # Score < 40


class Status(Enum):
    NEU = "neu"
    GESEHEN = "gesehen"
    BEANTWORTET = "beantwortet"
    UEBERSPRUNGEN = "uebersprungen"


class PlattformStatus(Enum):
    VORGESCHLAGEN = "vorgeschlagen"
    GENEHMIGT = "genehmigt"
    AKTIV = "aktiv"
    DEAKTIVIERT = "deaktiviert"
    FEHLGESCHLAGEN = "fehlgeschlagen"


class PlattformTyp(Enum):
    STATISCH = "statisch"
    DYNAMISCH = "dynamisch"
    ENTDECKT = "entdeckt"


class EntscheidungTyp(Enum):
    PLATTFORM_NEU = "plattform_neu"
    STRATEGIE_PLAN = "strategie_plan"
    SUCHBEGRIFF_AENDERUNG = "suchbegriff_aenderung"


class EntscheidungStatus(Enum):
    OFFEN = "offen"
    GENEHMIGT = "genehmigt"
    ABGELEHNT = "abgelehnt"
    ABGELAUFEN = "abgelaufen"


@dataclass
class Listing:
    """Ein gefundenes Inserat/Gesuch von einer Plattform."""
    url: str
    titel: str
    beschreibung: str
    ort: str
    quelle: Quelle
    datum_gefunden: datetime = field(default_factory=datetime.now)
    datum_inserat: Optional[str] = None
    preis: Optional[str] = None
    kontakt: Optional[str] = None
    rohdaten: Optional[dict] = None

    @property
    def url_hash(self) -> str:
        """Eindeutiger Hash der URL für Deduplizierung."""
        import hashlib
        return hashlib.md5(self.url.encode()).hexdigest()


@dataclass
class Bewertungsergebnis:
    """Ergebnis der Bewertung eines Listings."""
    listing: Listing
    score_gesamt: int          # 0-100
    score_region: int          # 0-30
    score_leistung: int        # 0-40
    score_qualitaet: int       # 0-30
    kategorie: Kategorie
    prioritaet: Prioritaet
    ausgeschlossen: bool = False
    ausschluss_grund: Optional[str] = None
    antwort_vorschlag: Optional[str] = None
    ki_begruendung: str = ""

    @property
    def ist_relevant(self) -> bool:
        return not self.ausgeschlossen and self.prioritaet != Prioritaet.ROT


@dataclass
class StrategiePlan:
    """Ergebnis der KI-Strategieanalyse."""
    neue_suchbegriffe: list[str]
    deaktivierte_begriffe: list[str]
    plattform_empfehlungen: list[dict]
    begruendung: str
    datum: datetime


@dataclass
class PlattformConfig:
    """Konfiguration einer dynamisch entdeckten Plattform."""
    name: str
    basis_url: str
    typ: str = "entdeckt"
    scraper_config: Optional[dict] = None
    status: str = "vorgeschlagen"
    entdeckt_von: Optional[str] = None
    erfolgsrate: float = 0.0
    gesamt_listings: int = 0
    relevante_listings: int = 0


@dataclass
class Entscheidung:
    """Eine offene Nutzer-Entscheidung."""
    typ: str
    titel: str
    beschreibung: str = ""
    daten_json: Optional[dict] = None
    status: str = "offen"
    id: Optional[int] = None
    telegram_message_id: Optional[int] = None
