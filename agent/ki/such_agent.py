"""KI-Agent 2: Suche & Bewertung – bewertet Listings per GPT."""

import json
from typing import Optional

from ki.client import KIClient, json_extrahieren
from models import Listing, Bewertungsergebnis, Kategorie, Prioritaet
from filter.scorer import Scorer
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.such")

SYSTEM_PROMPT = """Du bist ein Bewertungs-Analyst für SE Handwerk, ein Handwerksbetrieb in Heilbronn.

SE Handwerk bietet:
- Bodenarbeiten: Laminat verlegen, Vinyl/Klickvinyl verlegen, Sockelleisten, Trittschalldämmung, alten Boden entfernen
- Möbel-/Gerätemontage: IKEA-Möbel, Homegym/Fitnessgeräte (Power Rack, Kraftstation, Multipress), Küchenmontage
- Wohnungsübergabe: Renovierung vor Auszug, Streichen, Kleinreparaturen, Böden für Übergabe

Region: Heilbronn + 100 km Umkreis (Stuttgart, Ludwigsburg, Mannheim, Heidelberg, Schwäbisch Hall, Neckarsulm, Weinsberg).

WICHTIG: Antworte AUSSCHLIESSLICH mit einem JSON-Array. Kein Einleitungstext, keine Erklärung, kein Markdown.

Gib direkt dieses Format zurück:
[{"index": 0, "score_gesamt": 75, "score_region": 25, "score_leistung": 30, "score_qualitaet": 20, "kategorie": "boden", "prioritaet": "gruen", "begruendung": "Kurze Begründung"}]

Bewertung:
- Relevanz (0-40): Passt es zu SE Handwerk Leistungen?
- Region (0-30): Liegt es im Einzugsgebiet?
- Qualität (0-30): Konkreter Auftrag? Privatkunde? Dringend?

Priorität: gruen (≥70), gelb (40-69), rot (<40)
Kategorie: boden, montage, uebergabe, sonstiges

Wichtig:
- Werbung/Shops bekommen Score 0
- "Gesuch" oder "Suche" im Titel erhöht Qualitäts-Score
"""


class SuchAgent:
    """Autonomer KI-Agent für Suche und Bewertung.

    Nutzt die bestehenden Scraper, bewertet Ergebnisse aber per GPT
    statt nur mit Keyword-Regeln.
    """

    def __init__(self, ki_client: KIClient, config: dict):
        self.ki = ki_client
        self.config = config
        self._modell = config.get("ki", {}).get("openai_modell", "gpt-4o-mini")
        self._batch_groesse = config.get("ki", {}).get("bewertung", {}).get("batch_groesse", 5)
        self._max_tokens = config.get("ki", {}).get("bewertung", {}).get("max_tokens", 500)
        self._fallback_scorer = Scorer(config)

    def suchen_und_bewerten(self, listings: list[Listing]) -> list[Bewertungsergebnis]:
        """Bewertet eine Liste von Listings – per GPT oder Fallback."""
        if not self.ki.ist_verfuegbar:
            logger.info("KI nicht verfügbar – nutze regelbasierten Scorer")
            return [self._fallback_bewerten(l) for l in listings]

        ergebnisse = []
        # In Batches aufteilen
        for i in range(0, len(listings), self._batch_groesse):
            batch = listings[i:i + self._batch_groesse]
            batch_ergebnisse = self.batch_bewerten(batch)
            if batch_ergebnisse:
                ergebnisse.extend(batch_ergebnisse)
            else:
                # Fallback für fehlgeschlagenen Batch
                logger.warning(f"KI-Bewertung fehlgeschlagen für Batch {i // self._batch_groesse + 1} – Fallback")
                ergebnisse.extend([self._fallback_bewerten(l) for l in batch])

        return ergebnisse

    def batch_bewerten(self, listings: list[Listing]) -> Optional[list[Bewertungsergebnis]]:
        """Bewertet mehrere Listings in einem API-Call."""
        if not listings:
            return []

        user_prompt = self._build_batch_prompt(listings)

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=self._max_tokens * len(listings),
            agent_name="such",
        )

        if not antwort:
            return None

        return self._parse_batch_antwort(antwort, listings)

    def _fallback_bewerten(self, listing: Listing) -> Bewertungsergebnis:
        """Regelbasierter Fallback (bestehender Scorer) bei API-Fehler."""
        return self._fallback_scorer.bewerten(listing)

    def _build_batch_prompt(self, listings: list[Listing]) -> str:
        """Baut den User-Prompt für einen Batch von Listings."""
        eintraege = []
        for i, listing in enumerate(listings):
            eintraege.append(
                f"[{i}] Titel: {listing.titel[:100]}\n"
                f"    Beschreibung: {listing.beschreibung[:300]}\n"
                f"    Ort: {listing.ort}\n"
                f"    Quelle: {listing.quelle.value}\n"
                f"    URL: {listing.url[:100]}"
            )

        return (
            f"Bewerte die folgenden {len(listings)} Listings:\n\n"
            + "\n\n".join(eintraege)
            + "\n\nGIB NUR DAS JSON-ARRAY ZURÜCK. Kein Text vor oder nach dem JSON."
        )

    def _parse_batch_antwort(
        self, antwort: str, listings: list[Listing]
    ) -> Optional[list[Bewertungsergebnis]]:
        """Parst die JSON-Antwort in Bewertungsergebnisse."""
        daten = json_extrahieren(antwort)
        if not daten:
            logger.error("Konnte kein JSON aus KI-Batch-Antwort extrahieren")
            return None

        # Manchmal kommt die Antwort als {"bewertungen": [...]} statt direkt als Array
        if isinstance(daten, dict):
            # Versuche verschiedene Schlüssel
            for key in ["bewertungen", "ergebnisse", "listings", "results"]:
                if key in daten:
                    daten = daten[key]
                    break
            else:
                # Falls kein passender Key, versuche den ersten Array-Wert
                for v in daten.values():
                    if isinstance(v, list):
                        daten = v
                        break

        if not isinstance(daten, list):
            logger.warning("KI-Antwort ist kein Array")
            return None

        ergebnisse = []
        for i, listing in enumerate(listings):
            # Finde passende Bewertung (nach Index oder Position)
            bewertung = None
            for d in daten:
                if d.get("index") == i:
                    bewertung = d
                    break
            if bewertung is None and i < len(daten):
                bewertung = daten[i]

            if bewertung is None:
                ergebnisse.append(self._fallback_bewerten(listing))
                continue

            try:
                kategorie_str = bewertung.get("kategorie", "sonstiges").lower()
                kategorie = {
                    "boden": Kategorie.BODEN,
                    "montage": Kategorie.MONTAGE,
                    "uebergabe": Kategorie.UEBERGABE,
                }.get(kategorie_str, Kategorie.SONSTIGES)

                score_gesamt = int(bewertung.get("score_gesamt", 0))
                score_gesamt = max(0, min(100, score_gesamt))

                if score_gesamt >= 70:
                    prioritaet = Prioritaet.GRUEN
                elif score_gesamt >= 40:
                    prioritaet = Prioritaet.GELB
                else:
                    prioritaet = Prioritaet.ROT

                ergebnis = Bewertungsergebnis(
                    listing=listing,
                    score_gesamt=score_gesamt,
                    score_region=int(bewertung.get("score_region", 0)),
                    score_leistung=int(bewertung.get("score_leistung", 0)),
                    score_qualitaet=int(bewertung.get("score_qualitaet", 0)),
                    kategorie=kategorie,
                    prioritaet=prioritaet,
                    ki_begruendung=bewertung.get("begruendung", ""),
                )
                ergebnisse.append(ergebnis)

                logger.info(
                    f"KI-Score: {score_gesamt}/100 [{prioritaet.value}] "
                    f"→ {listing.titel[:50]}"
                )

            except (ValueError, TypeError) as e:
                logger.warning(f"Fehler beim Parsen der Bewertung für Listing {i}: {e}")
                ergebnisse.append(self._fallback_bewerten(listing))

        return ergebnisse
