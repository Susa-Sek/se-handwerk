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


class KontaktStatus(Enum):
    AUSSTEHEND    = "ausstehend"     # extrahiert, wartet auf Telegram-Freigabe
    GENEHMIGT     = "genehmigt"      # freigegeben, noch nicht gesendet
    GESENDET      = "gesendet"       # erste E-Mail raus
    FOLLOW_UP_1   = "follow_up_1"    # Follow-up 1 gesendet (Tag 3)
    FOLLOW_UP_2   = "follow_up_2"    # Follow-up 2 gesendet (Tag 7)
    BEANTWORTET   = "beantwortet"    # Antwort im Posteingang erkannt
    ABGELEHNT     = "abgelehnt"      # per Telegram abgelehnt
    ABGESCHLOSSEN = "abgeschlossen"  # kein weiterer Kontakt nötig


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


class B2BKontaktTyp(Enum):
    HAUSVERWALTUNG  = "hausverwaltung"   # Hauptziel: viel Wiederholungsgeschäft
    WOHNUNGSBAU     = "wohnungsbau"      # Großvolumen, Bestandsobjekte
    MAKLER          = "makler"           # Vor Verkauf/Vermietung
    FACILITY        = "facility"         # Outsourcing-Partner
    UMZUG           = "umzug"            # Weiterempfehlung an Kunden
    SONSTIGES       = "sonstiges"


@dataclass
class B2BKontakt:
    """Ein B2B-Lead aus der Immobilienbranche."""
    firma: str
    website: str
    email: str
    typ: B2BKontaktTyp
    ort: str
    telefon: Optional[str] = None
    quelle: str = "gelbeseiten"          # gelbeseiten | google | manuell
    status: KontaktStatus = KontaktStatus.AUSSTEHEND
    id: Optional[int] = None
    gesendet_am: Optional[datetime] = None
    follow_up_1_am: Optional[datetime] = None
    follow_up_2_am: Optional[datetime] = None
    antwort_erhalten_am: Optional[datetime] = None
    abgemeldet_am: Optional[datetime] = None  # DSGVO Opt-out


@dataclass
class EmailKontakt:
    """E-Mail-Kontakt für Outreach-Workflow."""
    listing_url_hash: str
    empfaenger_email: str
    betreff: str
    nachricht_text: str
    status: KontaktStatus = KontaktStatus.AUSSTEHEND
    id: Optional[int] = None
    gesendet_am: Optional[datetime] = None
    follow_up_1_am: Optional[datetime] = None
    follow_up_2_am: Optional[datetime] = None
    antwort_erhalten_am: Optional[datetime] = None


@dataclass
class StrategiePlan:
    """Ergebnis der KI-Strategieanalyse."""
    neue_suchbegriffe: list[str]
    deaktivierte_begriffe: list[str]
    plattform_empfehlungen: list[dict]
    begruendung: str
    datum: datetime
