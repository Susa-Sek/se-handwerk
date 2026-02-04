"""KI-Agent 1: Suchstrategie – findet heraus WO und WAS gesucht werden soll."""

import json
from datetime import datetime
from typing import Optional

from database import Database
from ki.client import KIClient
from models import StrategiePlan
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.strategie")

SYSTEM_PROMPT = """Du bist ein Strategie-Analyst für SE Handwerk, ein Handwerksbetrieb in Heilbronn.
SE Handwerk bietet: Bodenarbeiten (Laminat, Vinyl, Klickboden), Möbel-/Gerätemontage (IKEA, Homegym, Fitnessgeräte), Wohnungsübergabe-Renovierung.
Region: Heilbronn + 100 km Umkreis (Stuttgart, Ludwigsburg, Mannheim, Heidelberg, Schwäbisch Hall).

Deine Aufgabe: Analysiere die bisherigen Suchergebnisse und optimiere die Suchstrategie.

Antworte IMMER als JSON mit folgender Struktur:
{
    "neue_suchbegriffe": ["Begriff 1", "Begriff 2"],
    "deaktivierte_begriffe": ["Begriff der nicht funktioniert"],
    "plattform_empfehlungen": [
        {"name": "Plattformname", "url": "https://...", "begruendung": "Warum relevant"}
    ],
    "begruendung": "Zusammenfassung der Analyse und Empfehlungen",
    "konfidenz": 0.75
}

Regeln:
- Suchbegriffe auf Deutsch (Zielgruppe ist deutschsprachig)
- Nur Begriffe die zu den SE Handwerk Leistungen passen
- Berücksichtige saisonale Trends (Umzug=Frühling/Sommer, Renovierung=Herbst)
- Keine Begriffe für Leistungen die SE Handwerk NICHT anbietet (Fliesen, Elektro, Sanitär, Dach)
- Plattform-Empfehlungen nur für deutsche Handwerker-Portale
- Konfidenz: 0.0-1.0, wie sicher du dir bei den Empfehlungen bist
"""


class StrategieAgent:
    """Autonomer KI-Agent für Suchstrategie.

    Entscheidet welche Plattformen, Suchbegriffe und Regionen
    die besten Leads bringen. Nutzt lern_metriken aus der DB.
    """

    def __init__(self, ki_client: KIClient, config: dict, db: Optional[Database] = None):
        self.ki = ki_client
        self.config = config
        self.db = db
        self._modell = config.get("ki", {}).get("strategie_modell", "claude-sonnet-4-20250514")
        self._letzter_lauf: Optional[datetime] = None
        self._auto_anwenden = config.get("ki", {}).get("strategie", {}).get("auto_anwenden", False)

    def soll_ausfuehren(self) -> bool:
        """Prüft ob die Strategie-Analyse heute schon gelaufen ist."""
        if self._letzter_lauf is None:
            return True
        return self._letzter_lauf.date() < datetime.now().date()

    def analysieren(self, statistik: dict, bisherige_ergebnisse: list) -> Optional[StrategiePlan]:
        """Analysiert bisherige Ergebnisse und erstellt neuen Suchplan.

        Args:
            statistik: Tagesstatistik aus der Datenbank
            bisherige_ergebnisse: Liste von dicts mit bisherigen Listings

        Returns:
            StrategiePlan oder None bei Fehler
        """
        if not self.ki.ist_verfuegbar:
            logger.info("KI nicht verfügbar – Strategie-Analyse übersprungen")
            return None

        aktuelle_begriffe = []
        for kategorie, begriffe in self.config.get("suchbegriffe", {}).items():
            aktuelle_begriffe.extend(begriffe)

        user_prompt = self._build_prompt(statistik, bisherige_ergebnisse, aktuelle_begriffe)

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=800,
            agent_name="strategie",
        )

        if not antwort:
            logger.warning("Keine Antwort vom Strategie-Agent")
            return None

        plan = self._parse_antwort(antwort)
        if plan:
            self._letzter_lauf = datetime.now()
            logger.info(
                f"Strategie-Plan erstellt: {len(plan.neue_suchbegriffe)} neue Begriffe, "
                f"{len(plan.deaktivierte_begriffe)} deaktiviert, "
                f"{len(plan.plattform_empfehlungen)} Plattform-Empfehlungen"
            )

            # Audit-Log
            if self.db:
                self.db.aktion_loggen(
                    agent_name="strategie_agent",
                    aktion="plan_erstellt",
                    details=plan.begruendung[:200],
                    daten_json={
                        "neue": plan.neue_suchbegriffe,
                        "deaktiviert": plan.deaktivierte_begriffe,
                    },
                )

        return plan

    def plattformen_bewerten(self) -> Optional[list[dict]]:
        """GPT recherchiert/bewertet neue Plattformen für Handwerker-Aufträge."""
        if not self.ki.ist_verfuegbar:
            return None

        user_prompt = (
            "Welche deutschen Online-Plattformen sind aktuell die besten Quellen "
            "für Handwerker-Aufträge im Bereich Bodenarbeiten, Möbelmontage und "
            "Wohnungsübergabe? Berücksichtige: Kleinanzeigen.de, MyHammer, nebenan.de, "
            "markt.de, Blauarbeit, Check24, und weitere.\n\n"
            "Bewerte jede Plattform nach: Auftragsvolumen, Qualität der Leads, "
            "Kosten, Zugänglichkeit für Scraping/API.\n\n"
            "Antworte als JSON mit einer Liste von Plattformen."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=600,
            agent_name="strategie",
        )

        if not antwort:
            return None

        try:
            daten = json.loads(antwort)
            return daten.get("plattform_empfehlungen", [])
        except (json.JSONDecodeError, KeyError):
            logger.warning("Konnte Plattform-Bewertung nicht parsen")
            return None

    def suchbegriffe_optimieren(self, kategorie: str, erfolgsrate: dict) -> list[str]:
        """Generiert optimierte Suchbegriffe basierend auf Erfolgsraten."""
        if not self.ki.ist_verfuegbar:
            return []

        user_prompt = (
            f"Kategorie: {kategorie}\n"
            f"Bisherige Erfolgsraten pro Suchbegriff:\n"
            f"{json.dumps(erfolgsrate, ensure_ascii=False, indent=2)}\n\n"
            f"Generiere 5 neue/optimierte Suchbegriffe für diese Kategorie. "
            f"Berücksichtige Synonyme, regionale Begriffe und saisonale Trends.\n\n"
            f"Antworte als JSON: {{\"neue_suchbegriffe\": [...]}}"
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=300,
            agent_name="strategie",
        )

        if not antwort:
            return []

        try:
            daten = json.loads(antwort)
            return daten.get("neue_suchbegriffe", [])
        except (json.JSONDecodeError, KeyError):
            return []

    def _build_prompt(self, statistik: dict, ergebnisse: list, aktuelle_begriffe: list) -> str:
        """Baut den User-Prompt für die Analyse – nutzt echte Metriken aus der DB."""
        # Erfolgsraten aus lern_metriken laden (falls DB verfügbar)
        metriken_text = ""
        if self.db:
            try:
                zusammenfassung = self.db.metriken_zusammenfassung(tage=7)

                # Suchbegriff-Metriken
                sb_metriken = zusammenfassung.get("suchbegriffe", [])
                if sb_metriken:
                    metriken_text += "\nErfolgsmetriken Suchbegriffe (letzte 7 Tage):\n"
                    for m in sb_metriken[:15]:
                        rate = (m["relevant"] / max(1, m["gesamt"])) * 100 if m["gesamt"] else 0
                        metriken_text += f"  {m['schluessel']}: {m['gesamt']} Treffer, {m['relevant']} relevant ({rate:.0f}%)\n"

                # Plattform-Metriken
                pf_metriken = zusammenfassung.get("plattformen", [])
                if pf_metriken:
                    metriken_text += "\nErfolgsmetriken Plattformen (letzte 7 Tage):\n"
                    for m in pf_metriken[:10]:
                        rate = (m["relevant"] / max(1, m["gesamt"])) * 100 if m["gesamt"] else 0
                        metriken_text += f"  {m['schluessel']}: {m['gesamt']} Ergebnisse, {m['relevant']} relevant ({rate:.0f}%)\n"

                # Scrape-Log Statistik
                scrape_stats = self.db.scrape_log_statistik(tage=7)
                if scrape_stats:
                    metriken_text += "\nScrape-Protokoll (letzte 7 Tage):\n"
                    for s in scrape_stats[:10]:
                        metriken_text += (
                            f"  {s['plattform_name']}: {s['scrapes']} Scrapes, "
                            f"{s.get('ergebnisse_gesamt') or 0} Ergebnisse, "
                            f"{s.get('fehler') or 0} Fehler\n"
                        )
            except Exception as e:
                logger.debug(f"Metriken konnten nicht geladen werden: {e}")

        # Fallback: Erfolgsraten aus Tages-Listings berechnen
        erfolg_pro_begriff = {}
        for e in ergebnisse:
            titel = e.get("titel", "").lower()
            for begriff in aktuelle_begriffe:
                if begriff.lower() in titel:
                    if begriff not in erfolg_pro_begriff:
                        erfolg_pro_begriff[begriff] = {"treffer": 0, "gruen": 0, "gelb": 0, "rot": 0}
                    erfolg_pro_begriff[begriff]["treffer"] += 1
                    prio = e.get("prioritaet", "rot")
                    if prio in erfolg_pro_begriff[begriff]:
                        erfolg_pro_begriff[begriff][prio] += 1

        monat = datetime.now().month
        jahreszeit = {
            12: "Winter", 1: "Winter", 2: "Winter",
            3: "Frühling", 4: "Frühling", 5: "Frühling",
            6: "Sommer", 7: "Sommer", 8: "Sommer",
            9: "Herbst", 10: "Herbst", 11: "Herbst",
        }.get(monat, "unbekannt")

        prompt = (
            f"Aktuelle Jahreszeit: {jahreszeit} (Monat {monat})\n\n"
            f"Tagesstatistik:\n"
            f"- Gesamt: {statistik.get('gesamt', 0)} Listings\n"
            f"- Gruen (>=70): {statistik.get('gruen', 0)}\n"
            f"- Gelb (40-69): {statistik.get('gelb', 0)}\n"
            f"- Rot (<40): {statistik.get('rot', 0)}\n\n"
            f"Aktuelle Suchbegriffe: {json.dumps(aktuelle_begriffe, ensure_ascii=False)}\n\n"
        )

        if metriken_text:
            prompt += f"ECHTE ERFOLGSMETRIKEN (aus Datenbank):{metriken_text}\n\n"

        if erfolg_pro_begriff:
            prompt += (
                f"Tages-Erfolgsraten pro Begriff:\n"
                f"{json.dumps(erfolg_pro_begriff, ensure_ascii=False, indent=2)}\n\n"
            )

        prompt += "Analysiere die Daten und erstelle einen optimierten Suchplan."
        return prompt

    def _parse_antwort(self, antwort: str) -> Optional[StrategiePlan]:
        """Parst die JSON-Antwort in einen StrategiePlan."""
        try:
            daten = json.loads(antwort)
            return StrategiePlan(
                neue_suchbegriffe=daten.get("neue_suchbegriffe", []),
                deaktivierte_begriffe=daten.get("deaktivierte_begriffe", []),
                plattform_empfehlungen=daten.get("plattform_empfehlungen", []),
                begruendung=daten.get("begruendung", ""),
                datum=datetime.now(),
            )
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Fehler beim Parsen der Strategie-Antwort: {e}")
            return None
