"""KI-Agent 5: Lern-Agent – aggregiert Erfolgsmetriken und Feedback-Loop."""

from datetime import datetime
from typing import Optional

from database import Database
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.lern")


class LernAgent:
    """Aggregiert Daten nach jedem Durchlauf für die Feedback-Schleife.

    Sammelt:
    - scrape_log → Erfolgsraten pro Plattform/Suchbegriff
    - listings → Score-Verteilung pro Kategorie/Region
    - Ergebnisse in lern_metriken speichern
    - Schwache Suchbegriffe/Plattformen identifizieren
    """

    def __init__(self, config: dict, db: Database):
        self.config = config
        self.db = db
        self._lern_config = config.get("lernen", {})
        self._auto_deaktivierung_tage = self._lern_config.get("auto_deaktivierung_tage", 14)
        self._min_erfolgsrate = self._lern_config.get("min_erfolgsrate_plattform", 0.05)

    def nach_durchlauf(self, durchlauf_ergebnisse: Optional[dict] = None):
        """Wird nach jedem Durchlauf aufgerufen – aggregiert Metriken.

        Args:
            durchlauf_ergebnisse: Optional dict mit Ergebnissen des Durchlaufs:
                {
                    "scraper_ergebnisse": {
                        "plattform_name": {
                            "suchbegriff": {"ergebnisse": int, "relevante": int}
                        }
                    }
                }
        """
        heute = datetime.now().strftime("%Y-%m-%d")

        # 1. Scrape-Log aggregieren
        self._scrape_log_aggregieren(heute)

        # 2. Durchlauf-Ergebnisse verarbeiten (falls vorhanden)
        if durchlauf_ergebnisse:
            self._durchlauf_metriken(heute, durchlauf_ergebnisse)

        # 3. Plattform-Statistiken aktualisieren
        self._plattform_metriken_aktualisieren(heute)

        # 4. Schwache Suchbegriffe identifizieren
        vorschlaege = self._schwache_identifizieren()

        self.db.aktion_loggen(
            agent_name="lern_agent",
            aktion="metriken_aggregiert",
            details=f"Datum: {heute}, Vorschläge: {len(vorschlaege)}",
        )

        logger.info(f"LernAgent: Metriken aggregiert für {heute}")
        return vorschlaege

    def _scrape_log_aggregieren(self, datum: str):
        """Aggregiert scrape_log-Daten in lern_metriken."""
        # Plattform-Erfolg aus scrape_log der letzten 24h
        stats = self.db.scrape_log_statistik(tage=1)
        for s in stats:
            self.db.metrik_speichern(
                metrik_typ="plattform_erfolg",
                schluessel=s["plattform_name"],
                zeitraum="tag",
                datum=datum,
                wert_anzahl=s.get("ergebnisse_gesamt") or 0,
                wert_relevant=s.get("relevante_gesamt") or 0,
                wert_score=(s.get("relevante_gesamt") or 0) / max(1, s.get("ergebnisse_gesamt") or 1),
            )

        # Suchbegriff-Erfolg
        sb_stats = self.db.scrape_log_suchbegriff_statistik(tage=1)
        for s in sb_stats:
            if s.get("suchbegriff"):
                self.db.metrik_speichern(
                    metrik_typ="suchbegriff_erfolg",
                    schluessel=s["suchbegriff"],
                    zeitraum="tag",
                    datum=datum,
                    wert_anzahl=s.get("ergebnisse_gesamt") or 0,
                    wert_relevant=s.get("relevante_gesamt") or 0,
                )

    def _durchlauf_metriken(self, datum: str, ergebnisse: dict):
        """Verarbeitet direkte Durchlauf-Ergebnisse."""
        scraper_ergebnisse = ergebnisse.get("scraper_ergebnisse", {})
        for plattform, begriffe in scraper_ergebnisse.items():
            gesamt_plattform = 0
            relevant_plattform = 0
            for begriff, zahlen in begriffe.items():
                anz = zahlen.get("ergebnisse", 0)
                rel = zahlen.get("relevante", 0)
                gesamt_plattform += anz
                relevant_plattform += rel

                self.db.metrik_speichern(
                    metrik_typ="suchbegriff_erfolg",
                    schluessel=begriff,
                    zeitraum="tag",
                    datum=datum,
                    wert_anzahl=anz,
                    wert_relevant=rel,
                )

            self.db.metrik_speichern(
                metrik_typ="plattform_erfolg",
                schluessel=plattform,
                zeitraum="tag",
                datum=datum,
                wert_anzahl=gesamt_plattform,
                wert_relevant=relevant_plattform,
                wert_score=relevant_plattform / max(1, gesamt_plattform),
            )

    def _plattform_metriken_aktualisieren(self, datum: str):
        """Aktualisiert Plattform-Statistiken basierend auf Scrape-Logs."""
        stats = self.db.scrape_log_statistik(tage=1)
        for s in stats:
            gesamt = s.get("ergebnisse_gesamt") or 0
            relevante = s.get("relevante_gesamt") or 0
            if gesamt > 0:
                plattform = self.db.plattform_laden(s["plattform_name"])
                if plattform:
                    self.db.plattform_statistik_aktualisieren(
                        s["plattform_name"], gesamt, relevante
                    )

    def _schwache_identifizieren(self) -> list[dict]:
        """Identifiziert schwache Suchbegriffe und Plattformen.

        Returns:
            Liste von Vorschlägen zur Deaktivierung.
        """
        vorschlaege = []

        # Schwache Suchbegriffe (0 relevante Treffer seit X Tagen)
        sb_stats = self.db.scrape_log_suchbegriff_statistik(tage=self._auto_deaktivierung_tage)
        for s in sb_stats:
            if s.get("suchbegriff") and (s.get("relevante_gesamt") or 0) == 0:
                scrapes = s.get("scrapes") or 0
                if scrapes >= 5:  # Mindestens 5 Versuche
                    vorschlaege.append({
                        "typ": "suchbegriff_schwach",
                        "schluessel": s["suchbegriff"],
                        "grund": f"0 relevante Treffer bei {scrapes} Versuchen in {self._auto_deaktivierung_tage} Tagen",
                    })

        # Schwache Plattformen
        plattformen = self.db.plattformen_laden(status="aktiv")
        for p in plattformen:
            if p.get("gesamt_listings", 0) >= 20:
                rate = p.get("erfolgsrate", 0)
                if rate < self._min_erfolgsrate:
                    vorschlaege.append({
                        "typ": "plattform_schwach",
                        "schluessel": p["name"],
                        "grund": (
                            f"Erfolgsrate {rate:.1%} unter Minimum {self._min_erfolgsrate:.1%} "
                            f"({p['relevante_listings']}/{p['gesamt_listings']} relevant)"
                        ),
                    })

            if p.get("fehler_zaehler", 0) >= 10:
                vorschlaege.append({
                    "typ": "plattform_fehler",
                    "schluessel": p["name"],
                    "grund": f"{p['fehler_zaehler']} Fehler aufgelaufen",
                })

        if vorschlaege:
            logger.info(f"LernAgent: {len(vorschlaege)} Deaktivierungs-Vorschläge")
            for v in vorschlaege:
                logger.info(f"  [{v['typ']}] {v['schluessel']}: {v['grund']}")

        return vorschlaege

    def deaktivierung_vorschlagen(self, vorschlaege: list[dict]) -> list[int]:
        """Erstellt Entscheidungen für Deaktivierungs-Vorschläge.

        Returns:
            Liste von Entscheidungs-IDs.
        """
        entscheidung_ids = []
        for v in vorschlaege:
            entscheidung_id = self.db.entscheidung_erstellen(
                typ="suchbegriff_aenderung",
                titel=f"Deaktivierung: {v['schluessel']}",
                beschreibung=f"Typ: {v['typ']}\nGrund: {v['grund']}",
                daten_json=v,
            )
            entscheidung_ids.append(entscheidung_id)
        return entscheidung_ids
