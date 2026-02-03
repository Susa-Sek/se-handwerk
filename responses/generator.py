"""Antwort-Generator: Erstellt passende Erstnachrichten nach SE Handwerk Tonalität."""

from models import Kategorie, Bewertungsergebnis
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.responses")


# Antwort-Templates pro Kategorie
# Tonalität: freundlich, sachlich, nicht aufdringlich, kompetent, lösungsorientiert

TEMPLATES = {
    Kategorie.BODEN: {
        "standard": (
            "Guten Tag,\n\n"
            "gerne unterstützen wir Sie bei Ihren Bodenarbeiten. "
            "Ob Laminat, Vinyl oder Klickvinyl – wir bringen Erfahrung und "
            "saubere Ausführung mit.\n\n"
            "Um den Aufwand realistisch einzuschätzen, würden wir vorab ein "
            "paar kurze Infos benötigen:\n"
            "- Fläche in m² (ca.)\n"
            "- Aktueller Bodenbelag vorhanden?\n"
            "- Gewünschtes Material (falls bereits bekannt)\n"
            "- Fotos vom Raum wären ideal\n\n"
            "Wir melden uns dann zeitnah mit einem transparenten Angebot.\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
        "entfernung": (
            "Guten Tag,\n\n"
            "das Entfernen alter Bodenbeläge und die Untergrundvorbereitung "
            "gehören zu unseren Kernleistungen. Gerne kümmern wir uns auch "
            "um das anschließende Verlegen des neuen Bodens.\n\n"
            "Könnten Sie uns kurz mitteilen:\n"
            "- Welcher Belag soll entfernt werden?\n"
            "- Fläche in m² (ca.)\n"
            "- Soll direkt ein neuer Boden verlegt werden?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
        "sockelleisten": (
            "Guten Tag,\n\n"
            "die Montage von Sockelleisten übernehmen wir gerne – "
            "auch als separate Leistung. Sauberer Abschluss inklusive.\n\n"
            "Kurze Info vorab:\n"
            "- Wie viele Laufmeter ca.?\n"
            "- Material vorhanden oder sollen wir beraten?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
    },
    Kategorie.MONTAGE: {
        "standard": (
            "Guten Tag,\n\n"
            "Möbelmontage ist einer unserer Schwerpunkte – ob IKEA, "
            "Markenmöbel oder Spezialaufbauten. Wir arbeiten sorgfältig "
            "und bringen alles nötige Werkzeug mit.\n\n"
            "Damit wir den Aufwand einschätzen können:\n"
            "- Um welche Möbelstücke handelt es sich?\n"
            "- Sind Aufbauanleitungen vorhanden?\n"
            "- Wunschtermin?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
        "ikea": (
            "Guten Tag,\n\n"
            "IKEA-Montage machen wir regelmäßig – vom PAX-Schrank bis "
            "zur kompletten Küche. Schnell, sauber, ohne Stress für Sie.\n\n"
            "Kurze Fragen vorab:\n"
            "- Welche Möbel sollen aufgebaut werden?\n"
            "- Ist die Ware schon geliefert?\n"
            "- Wandmontage nötig (z.B. Kippsicherung)?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
        "fitness": (
            "Guten Tag,\n\n"
            "der Aufbau von Fitnessgeräten und Homegym-Systemen ist "
            "eine unserer Spezialisierungen. Egal ob Power Rack, Squat Rack "
            "oder Multistation – wir kennen die gängigen Systeme und "
            "sorgen für sichere Montage inkl. Wandbefestigung falls nötig.\n\n"
            "Dafür bräuchten wir:\n"
            "- Welches Gerät / Hersteller / Modell?\n"
            "- Ist es bereits geliefert?\n"
            "- Wand- oder Bodenbefestigung gewünscht?\n"
            "- Fotos vom Aufstellort\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
    },
    Kategorie.UEBERGABE: {
        "standard": (
            "Guten Tag,\n\n"
            "Übergaberenovierungen sind bei uns in guten Händen. "
            "Wir bieten alles aus einer Hand: Wände streichen, Böden "
            "erneuern, Kleinreparaturen – schnell und zuverlässig.\n\n"
            "Damit wir ein Angebot erstellen können:\n"
            "- Wie groß ist die Wohnung (m² / Zimmer)?\n"
            "- Welche Arbeiten sind nötig?\n"
            "- Bis wann muss es fertig sein?\n"
            "- Fotos wären sehr hilfreich\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
        "vermieter": (
            "Guten Tag,\n\n"
            "wir unterstützen regelmäßig Vermieter bei der "
            "Instandsetzung zwischen Mieterwechseln. Schnelle "
            "Terminvergabe und transparente Preise sind dabei "
            "selbstverständlich.\n\n"
            "Was wird benötigt?\n"
            "- Wände / Decken streichen?\n"
            "- Böden erneuern oder ausbessern?\n"
            "- Kleinreparaturen?\n"
            "- Wohnungsgröße?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
    },
    Kategorie.SONSTIGES: {
        "standard": (
            "Guten Tag,\n\n"
            "gerne unterstützen wir Sie bei Ihrem Vorhaben. "
            "Um den Aufwand realistisch einzuschätzen, würden wir "
            "vorab ein paar kurze Infos bzw. Fotos benötigen.\n\n"
            "Was genau wird benötigt und bis wann?\n\n"
            "Viele Grüße\nSE Handwerk"
        ),
    },
}


class ResponseGenerator:
    """Generiert passende Antwort-Texte basierend auf Listing-Kategorie."""

    def __init__(self, config: dict):
        self.config = config

    def generieren(self, ergebnis: Bewertungsergebnis) -> str:
        """Generiert den besten Antwortvorschlag für ein Bewertungsergebnis."""
        kategorie = ergebnis.kategorie
        listing = ergebnis.listing
        text = f"{listing.titel} {listing.beschreibung}".lower()

        # Kategorie-spezifische Template-Auswahl
        templates = TEMPLATES.get(kategorie, TEMPLATES[Kategorie.SONSTIGES])

        # Sub-Template wählen basierend auf Keywords
        template_key = self._waehle_sub_template(text, kategorie)
        template = templates.get(template_key, templates["standard"])

        logger.debug(
            f"Template: {kategorie.value}/{template_key} für '{listing.titel[:40]}'"
        )

        return template

    def _waehle_sub_template(self, text: str, kategorie: Kategorie) -> str:
        """Wählt das passendste Sub-Template basierend auf Text-Analyse."""

        if kategorie == Kategorie.BODEN:
            if any(kw in text for kw in ["entfernen", "abreißen", "rausreißen", "alten boden"]):
                return "entfernung"
            if any(kw in text for kw in ["sockelleist", "fußleist"]):
                return "sockelleisten"

        elif kategorie == Kategorie.MONTAGE:
            if any(kw in text for kw in ["ikea", "pax", "kallax", "malm", "besta"]):
                return "ikea"
            if any(kw in text for kw in [
                "fitness", "homegym", "power rack", "squat", "hantel",
                "kraftstation", "laufband", "gym", "trainingsgerät",
            ]):
                return "fitness"

        elif kategorie == Kategorie.UEBERGABE:
            if any(kw in text for kw in ["vermieter", "mieter", "mietwohnung", "vermietung"]):
                return "vermieter"

        return "standard"
