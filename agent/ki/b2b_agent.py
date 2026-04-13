"""KI-Agent für B2B-Outreach — schreibt Partnerschafts-Pitches an Immobilienfirmen."""

from typing import Optional

from ki.client import KIClient
from models import B2BKontakt, B2BKontaktTyp
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.b2b")

# ── System-Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Du bist der B2B-Akquise-Experte für SE Handwerk, ein spezialisierter
Handwerksbetrieb in Heilbronn.

SE Handwerk Profil:
- Kernleistungen: Bodenarbeiten (Laminat, Vinyl, Klickboden), Möbel-/Gerätemontage,
  Wohnungsübergaben und Auszugsrenovierungen
- Region: Heilbronn und 100 km Umkreis
- Stärken: Kurzfristig verfügbar, zuverlässig, saubere Arbeit, faire Konditionen,
  direkte Kommunikation ohne Bürokratie
- Ziel: Langfristige Partnerschaften mit Immobilienunternehmen

Deine Aufgabe: Schreibe kurze, professionelle B2B-Akquise-E-Mails.

Stil-Regeln:
- Professionell, sachlich, auf Augenhöhe — KEIN "Sehr geehrte Damen und Herren"
- Kurz: max. 120 Wörter im Haupttext
- Konkreter Nutzen für den Empfänger im Mittelpunkt (nicht unsere Leistungen)
- Ein klarer CTA am Ende (kurzes Gespräch, Kennenlernen)
- KEIN Preisangebot, KEINE Superlative
- Am Ende immer: Opt-out-Hinweis auf separater Zeile
"""

# ── Nutzen-Beschreibungen je Zieltyp ────────────────────────────────────────

NUTZEN_PRO_TYP: dict[str, str] = {
    "hausverwaltung": (
        "schnelle Mieterwechsel, saubere Wohnungsübergaben und zuverlässige "
        "Bodenarbeiten — ohne lange Vorlaufzeiten"
    ),
    "wohnungsbau": (
        "einen verlässlichen Handwerkspartner für Bodenverlegung, Montagearbeiten "
        "und Übergaberenovierungen im Bestand"
    ),
    "makler": (
        "Objekte schnell verkaufsbereit machen: neuer Boden, Möbelmontage, "
        "kleine Renovierungsarbeiten vor dem Besichtigungstermin"
    ),
    "facility": (
        "einen flexiblen Subunternehmer für Bodenarbeiten und Montagen — "
        "kurzfristig abrufbar, Region Heilbronn"
    ),
    "umzug": (
        "eine Weiterempfehlung für Kunden, die nach dem Umzug Boden verlegen "
        "oder Möbel aufbauen lassen möchten"
    ),
    "sonstiges": (
        "Bodenarbeiten, Montagen und Übergaberenovierungen in der Region Heilbronn"
    ),
}

OPT_OUT = "\n\nWenn Sie keine weiteren E-Mails von uns wünschen, antworten Sie einfach mit \"Abmelden\"."


class B2BAgent:
    """Erstellt typenspezifische B2B-Partnerschafts-E-Mails."""

    def __init__(self, ki_client: KIClient, config: dict):
        self.ki = ki_client
        self._modell = config.get("ki", {}).get("openai_modell", "gpt-4o-mini")
        self._max_tokens = config.get("ki", {}).get("b2b", {}).get("max_tokens", 600)

    def email_erstellen(self, kontakt: B2BKontakt) -> tuple[str, str]:
        """Erstellt (betreff, text) für den ersten B2B-Kontakt."""
        betreff = self._betreff(kontakt)
        nutzen  = NUTZEN_PRO_TYP.get(kontakt.typ.value, NUTZEN_PRO_TYP["sonstiges"])

        if not self.ki.ist_verfuegbar:
            return betreff, self._fallback_text(kontakt, nutzen, 0) + OPT_OUT

        user_prompt = (
            f"Schreibe eine B2B-Akquise-E-Mail an folgendes Unternehmen:\n\n"
            f"Firma: {kontakt.firma}\n"
            f"Typ: {kontakt.typ.value}\n"
            f"Ort: {kontakt.ort}\n\n"
            f"Nutzen für sie: {nutzen}\n\n"
            f"Format:\n"
            f"- Anrede: 'Guten Tag,' (kein Name, da unbekannt)\n"
            f"- Haupttext: max. 3 kurze Absätze, max. 120 Wörter\n"
            f"- CTA: kurzes Telefonat oder Kennenlernen vorschlagen\n"
            f"- Signatur: 'Mit freundlichen Grüßen\\nSE Handwerk\\n"
            f"kontakt@sehandwerk.de | Heilbronn'\n"
            f"Schreibe NUR den E-Mail-Text."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            max_tokens=self._max_tokens,
            agent_name="b2b_outreach",
        )

        if not antwort:
            return betreff, self._fallback_text(kontakt, nutzen, 0) + OPT_OUT

        text = antwort.strip().strip('"').strip("'")
        if "sehandwerk.de" not in text:
            text += "\n\nMit freundlichen Grüßen\nSE Handwerk\nkontakt@sehandwerk.de | Heilbronn"
        return betreff, text + OPT_OUT

    def follow_up_erstellen(self, kontakt: B2BKontakt, nummer: int) -> tuple[str, str]:
        """Follow-up 1 (Tag 5) und Follow-up 2 (Tag 12) — Template-basiert, kurz."""
        if nummer == 1:
            betreff = f"Kurze Nachfrage: Zusammenarbeit mit SE Handwerk"
            text = (
                f"Guten Tag,\n\n"
                f"ich wollte kurz nachfragen, ob meine E-Mail von vor einigen Tagen "
                f"angekommen ist. Wir unterstützen {kontakt.firma} gerne bei "
                f"{NUTZEN_PRO_TYP.get(kontakt.typ.value, 'Handwerksleistungen')}.\n\n"
                f"Haben Sie 10 Minuten für ein kurzes Kennenlerngespräch?\n\n"
                f"Mit freundlichen Grüßen\nSE Handwerk\n"
                f"kontakt@sehandwerk.de | Heilbronn"
            ) + OPT_OUT
        else:
            betreff = f"Letzte Nachricht: SE Handwerk als Partner"
            text = (
                f"Guten Tag,\n\n"
                f"dies ist meine letzte Nachricht zu einer möglichen Zusammenarbeit. "
                f"Sollte das Thema künftig relevant werden — wir sind in Heilbronn "
                f"und Umkreis kurzfristig verfügbar.\n\n"
                f"Mit freundlichen Grüßen\nSE Handwerk\n"
                f"kontakt@sehandwerk.de | Heilbronn"
            ) + OPT_OUT

        return betreff, text

    # ── Hilfsmethoden ────────────────────────────────────────────────────────

    def _betreff(self, kontakt: B2BKontakt) -> str:
        betreffs = {
            B2BKontaktTyp.HAUSVERWALTUNG: "Zuverlässiger Handwerkspartner für Ihre Mietobjekte",
            B2BKontaktTyp.WOHNUNGSBAU:    "Handwerkspartner für Ihren Bestand — SE Handwerk",
            B2BKontaktTyp.MAKLER:         "Objekte schnell aufwerten: SE Handwerk, Heilbronn",
            B2BKontaktTyp.FACILITY:       "Subunternehmer Bodenarbeiten & Montage, Raum HN",
            B2BKontaktTyp.UMZUG:          "Kooperationsanfrage: Handwerksleistungen nach Umzug",
            B2BKontaktTyp.SONSTIGES:      "Handwerkspartner in Heilbronn — SE Handwerk",
        }
        return betreffs.get(kontakt.typ, betreffs[B2BKontaktTyp.SONSTIGES])

    def _fallback_text(self, kontakt: B2BKontakt, nutzen: str, _: int) -> str:
        return (
            f"Guten Tag,\n\n"
            f"mein Name ist SE Handwerk aus Heilbronn. Wir sind spezialisiert auf "
            f"Bodenarbeiten (Laminat, Vinyl), Möbelmontage und Wohnungsübergaben "
            f"im Raum Heilbronn.\n\n"
            f"Für {kontakt.firma} könnten wir {nutzen} bieten — "
            f"kurzfristig und zu fairen Konditionen.\n\n"
            f"Hätten Sie Interesse an einem kurzen Kennenlerngespräch?\n\n"
            f"Mit freundlichen Grüßen\nSE Handwerk\n"
            f"kontakt@sehandwerk.de | Heilbronn"
        )
