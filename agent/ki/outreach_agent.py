"""KI-Agent 3: Outreach – schreibt personalisierte Nachrichten für Leads."""

from typing import Optional

from ki.client import KIClient
from models import Bewertungsergebnis, Kategorie
from responses.generator import ResponseGenerator
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.outreach")

SYSTEM_PROMPT = """Du bist der Kommunikations-Experte für SE Handwerk, ein Handwerksbetrieb in Heilbronn.

SE Handwerk Profil:
- Spezialisierung: Bodenarbeiten (Laminat, Vinyl, Klickboden), Möbel-/Gerätemontage, Wohnungsübergabe
- Region: Heilbronn und 100 km Umkreis
- Stärken: Zuverlässig, pünktlich, faire Preise, kurzfristig verfügbar
- Kontakt: Telefon und Terminvereinbarung

Deine Aufgabe: Schreibe individuelle, überzeugende Antwortnachrichten auf Inserate.

Regeln:
- Immer auf Deutsch, per Sie
- Kurz und konkret (max 3-4 Sätze)
- Bezug auf das konkrete Inserat nehmen (Titel/Beschreibung erwähnen)
- Regionale Nähe betonen (Heilbronn/Umkreis)
- Passende Erfahrung/Leistung hervorheben
- Immer mit CTA enden: Kontaktaufnahme anbieten
- KEINE konkreten Preise nennen
- Immer Besichtigung/Beratung anbieten
- Freundlich aber professionell
- Nicht aufdringlich oder übertrieben werblich

Nachrichten-Stil je nach Plattform:
- kleinanzeigen: Kurz, direkt, informell aber höflich
- myhammer: Professionell, mit Hinweis auf Erfahrung
- nebenan: Nachbarschaftlich, persönlich, "wir sind aus der Gegend"
- google/sonstige: Standard-professionell
"""


class OutreachAgent:
    """Autonomer KI-Agent für Outreach/Kontaktaufnahme.

    Generiert individuelle, überzeugende Nachrichten für jeden Lead.
    """

    def __init__(self, ki_client: KIClient, config: dict):
        self.ki = ki_client
        self.config = config
        self._modell = config.get("ki", {}).get("modell", "claude-3-haiku-20240307")
        self._max_tokens = config.get("ki", {}).get("outreach", {}).get("max_tokens", 800)
        self._stil_pro_plattform = config.get("ki", {}).get("outreach", {}).get("stil_pro_plattform", True)
        self._follow_up_tage = config.get("ki", {}).get("outreach", {}).get("follow_up_nach_tagen", 3)
        self._fallback_generator = ResponseGenerator(config)

    def nachricht_erstellen(self, ergebnis: Bewertungsergebnis) -> str:
        """Erstellt personalisierte Antwortnachricht für ein Listing."""
        if not self.ki.ist_verfuegbar:
            logger.info("KI nicht verfügbar – nutze Template-Generator")
            return self._fallback_generator.generieren(ergebnis)

        stil = ergebnis.listing.quelle.value if self._stil_pro_plattform else "standard"

        user_prompt = (
            f"Erstelle eine Antwortnachricht für folgendes Inserat:\n\n"
            f"Titel: {ergebnis.listing.titel}\n"
            f"Beschreibung: {ergebnis.listing.beschreibung[:500]}\n"
            f"Ort: {ergebnis.listing.ort}\n"
            f"Plattform: {ergebnis.listing.quelle.value}\n"
            f"Kategorie: {ergebnis.kategorie.value}\n"
            f"Score: {ergebnis.score_gesamt}/100\n\n"
            f"Stil: {stil}\n\n"
            f"Schreibe NUR die Nachricht, ohne Anführungszeichen oder Erklärungen."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            max_tokens=self._max_tokens,
            agent_name="outreach",
        )

        if not antwort:
            logger.warning("KI-Outreach fehlgeschlagen – nutze Fallback")
            return self._fallback_generator.generieren(ergebnis)

        nachricht = antwort.strip().strip('"').strip("'")
        logger.info(f"KI-Nachricht erstellt für '{ergebnis.listing.titel[:50]}' ({len(nachricht)} Zeichen)")
        return nachricht

    def nachricht_anpassen(self, ergebnis: Bewertungsergebnis, stil: str) -> str:
        """Passt Nachricht an Plattform-Stil an."""
        if not self.ki.ist_verfuegbar:
            return self._fallback_generator.generieren(ergebnis)

        stil_beschreibungen = {
            "kleinanzeigen": "kurz, direkt, informell aber höflich, mit Hinweis auf Verfügbarkeit",
            "myhammer": "professionell, mit Referenz auf Erfahrung und Qualifikation",
            "nebenan": "nachbarschaftlich, persönlich, 'wir sind aus der Gegend'",
            "standard": "professionell und freundlich",
        }

        stil_text = stil_beschreibungen.get(stil, stil_beschreibungen["standard"])

        user_prompt = (
            f"Erstelle eine Antwortnachricht im Stil: {stil_text}\n\n"
            f"Für dieses Inserat:\n"
            f"Titel: {ergebnis.listing.titel}\n"
            f"Beschreibung: {ergebnis.listing.beschreibung[:500]}\n"
            f"Ort: {ergebnis.listing.ort}\n"
            f"Kategorie: {ergebnis.kategorie.value}\n\n"
            f"Schreibe NUR die Nachricht."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            max_tokens=self._max_tokens,
            agent_name="outreach",
        )

        if not antwort:
            return self._fallback_generator.generieren(ergebnis)

        return antwort.strip().strip('"').strip("'")

    def follow_up_erstellen(self, ergebnis: Bewertungsergebnis, tage_seit_kontakt: int) -> Optional[str]:
        """Erstellt Follow-up Nachricht falls keine Antwort kam."""
        if not self.ki.ist_verfuegbar:
            return None

        if tage_seit_kontakt < self._follow_up_tage:
            return None

        user_prompt = (
            f"Erstelle eine kurze Follow-up Nachricht (2 Sätze max).\n\n"
            f"Ursprüngliches Inserat:\n"
            f"Titel: {ergebnis.listing.titel}\n"
            f"Kategorie: {ergebnis.kategorie.value}\n"
            f"Tage seit Erstkontakt: {tage_seit_kontakt}\n\n"
            f"Die Nachricht soll höflich nachfragen ob noch Interesse besteht, "
            f"ohne aufdringlich zu sein. Schreibe NUR die Nachricht."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            max_tokens=200,
            agent_name="outreach",
        )

        if antwort:
            return antwort.strip().strip('"').strip("'")
        return None
