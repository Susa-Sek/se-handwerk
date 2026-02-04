"""
SE Handwerk - Autonomer Akquise-Agent
=====================================
Haupteinstieg: Durchsucht Plattformen, bewertet Ergebnisse,
benachrichtigt per Telegram.

Nutzung:
    python main.py              # Startet den Agent mit Scheduler
    python main.py --einmal     # Einmaliger Durchlauf ohne Scheduler
    python main.py --test       # Test-Nachricht an Telegram senden
"""

import argparse
import signal
import sys
import time
from datetime import datetime
from pathlib import Path

import schedule
import yaml
from dotenv import load_dotenv

# Projektroot zu sys.path hinzufügen
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from database import Database
from filter.scorer import Scorer
from ki.client import KIClient
from ki.kanal_agent import KanalAgent
from ki.lern_agent import LernAgent
from ki.strategie_agent import StrategieAgent
from ki.such_agent import SuchAgent
from ki.outreach_agent import OutreachAgent
from models import Bewertungsergebnis, Prioritaet, Quelle
from notifications.telegram_bot import TelegramNotifier
from notifications.telegram_interaktiv import TelegramInteraktiv
from responses.generator import ResponseGenerator
from scrapers.dynamisch import DynamischScraper
from scrapers.kleinanzeigen import KleinanzeigenScraper
from scrapers.myhammer import MyHammerScraper
from scrapers.google_search import GoogleScraper
from scrapers.facebook import FacebookScraper
from scrapers.nebenan import NebenanScraper
from scrapers.markt import MarktScraper
from utils.date_parser import ist_nicht_aelter_als_stunden
from utils.logger import setup_logger

# .env laden (liegt im Projekt-Root, eine Ebene über agent/)
PROJEKT_ROOT = ROOT.parent
load_dotenv(PROJEKT_ROOT / ".env")

logger = setup_logger("se_handwerk.main")


class AkquiseAgent:
    """Hauptklasse: Orchestriert Scraping, Scoring und Benachrichtigung."""

    def __init__(self, config_pfad: str = "config.yaml", einmal: bool = False):
        self.config = self._load_config(config_pfad)
        self.db = Database(self.config.get("datenbank", {}).get("pfad", "se_handwerk.db"))
        self.scorer = Scorer(self.config)
        self.telegram = TelegramNotifier(self.config)
        self.response_gen = ResponseGenerator(self.config)
        self.scrapers = self._init_scrapers()
        self._running = True
        self._einmal = einmal

        # KI-Agenten initialisieren
        self.ki_enabled = self.config.get("ki", {}).get("enabled", False)
        if self.ki_enabled:
            self.ki_client = KIClient(self.config)
            self.strategie_agent = StrategieAgent(self.ki_client, self.config, self.db)
            self.such_agent = SuchAgent(self.ki_client, self.config)
            self.outreach_agent = OutreachAgent(self.ki_client, self.config)
            self.kanal_agent = KanalAgent(self.ki_client, self.config, self.db)
            self.lern_agent = LernAgent(self.config, self.db)
            logger.info(f"KI-Agenten aktiviert (Client verfügbar: {self.ki_client.ist_verfuegbar})")
        else:
            self.ki_client = None
            self.strategie_agent = None
            self.such_agent = None
            self.outreach_agent = None
            self.kanal_agent = None
            self.lern_agent = None

        # Interaktiver Telegram-Bot (nur im Daemon-Modus, nicht bei --einmal)
        self.telegram_interaktiv = None
        if not einmal and self.config.get("telegram", {}).get("interaktiv", False):
            self.telegram_interaktiv = TelegramInteraktiv(self.config, self.db)
            self.telegram_interaktiv.on_entscheidung = self._on_entscheidung
        elif not einmal:
            # LernAgent braucht keinen interaktiven Bot
            pass

        logger.info("=" * 50)
        logger.info("SE Handwerk Akquise-Agent gestartet")
        logger.info(f"Aktive Scraper: {[s.name for s in self.scrapers]}")
        logger.info(f"KI-Agenten: {'aktiviert' if self.ki_enabled else 'deaktiviert'}")
        if self.telegram_interaktiv:
            logger.info("Telegram interaktiv: aktiviert")
        logger.info("=" * 50)

    def _load_config(self, pfad: str) -> dict:
        """Lädt die Konfiguration aus config.yaml."""
        config_path = ROOT / pfad
        if not config_path.exists():
            logger.error(f"Config nicht gefunden: {config_path}")
            sys.exit(1)

        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        logger.info(f"Config geladen: {config_path}")
        return config

    def _init_scrapers(self) -> list:
        """Initialisiert alle aktivierten Scraper (statisch + dynamisch)."""
        scrapers = []

        # Statische Scraper
        if self.config.get("kleinanzeigen", {}).get("enabled", True):
            scrapers.append(KleinanzeigenScraper(self.config))

        if self.config.get("myhammer", {}).get("enabled", True):
            scrapers.append(MyHammerScraper(self.config))

        if self.config.get("google", {}).get("enabled", True):
            scrapers.append(GoogleScraper(self.config))

        if self.config.get("facebook", {}).get("enabled", False):
            scrapers.append(FacebookScraper(self.config))

        if self.config.get("nebenan", {}).get("enabled", False):
            scrapers.append(NebenanScraper(self.config))

        if self.config.get("markt", {}).get("enabled", False):
            scrapers.append(MarktScraper(self.config))

        # Dynamische Scraper aus DB laden
        scrapers.extend(self._dynamische_scraper_laden())

        return scrapers

    def _dynamische_scraper_laden(self) -> list:
        """Lädt aktive dynamische Scraper aus der Datenbank."""
        dynamische = []
        try:
            aktive_plattformen = self.db.plattformen_laden(status="aktiv")
            for plattform in aktive_plattformen:
                if plattform.get("scraper_config"):
                    try:
                        scraper = DynamischScraper(self.config, plattform)
                        dynamische.append(scraper)
                        logger.info(f"Dynamischer Scraper geladen: {plattform['name']}")
                    except Exception as e:
                        logger.error(f"Fehler beim Laden von DynamischScraper '{plattform['name']}': {e}")
                        self.db.plattform_fehler_zaehlen(plattform["name"])
        except Exception as e:
            logger.error(f"Fehler beim Laden dynamischer Scraper: {e}")
        return dynamische

    def _get_suchbegriffe(self) -> list[str]:
        """Sammelt alle Suchbegriffe aus der Config."""
        alle = []
        for kategorie, begriffe in self.config.get("suchbegriffe", {}).items():
            alle.extend(begriffe)
        return alle

    def _get_regionen(self) -> list[str]:
        """Suchgebiet: nur Heilbronn mit 100 km Radius (wenn aktiv)."""
        suchgebiet = self.config.get("suchgebiet", {})
        if suchgebiet.get("aktiv"):
            zentrum = suchgebiet.get("zentrum", "Heilbronn")
            logger.info(f"Suchgebiet: nur {zentrum} (Radius {suchgebiet.get('radius_km', 100)} km)")
            return [zentrum]
        regionen = []
        for region_data in self.config.get("regionen", {}).values():
            keywords = region_data.get("keywords", [])
            if keywords:
                regionen.append(keywords[0])
        return regionen

    def durchlauf(self):
        """Führt einen kompletten Scan-Durchlauf durch."""
        # Prüfe ob Agent pausiert ist
        if self.telegram_interaktiv and self.telegram_interaktiv.ist_pausiert:
            logger.info("Agent ist pausiert – Durchlauf übersprungen")
            return

        logger.info("-" * 40)
        logger.info(f"Starte Durchlauf: {datetime.now().strftime('%H:%M:%S')}")

        # 1. KanalAgent (wöchentlich) → Plattform-Entdeckung
        if self.ki_enabled and self.kanal_agent and self.kanal_agent.soll_ausfuehren():
            try:
                logger.info("→ Kanal-Entdeckung...")
                neue_plattformen = self.kanal_agent.entdecken()
                for p in neue_plattformen:
                    self._entscheidung_an_telegram(
                        p["entscheidung_id"],
                        p.get("name", "?"),
                        p.get("beschreibung", ""),
                    )
            except Exception as e:
                logger.error(f"Fehler bei Kanal-Agent: {e}")

        # 2. Genehmigte Entscheidungen verarbeiten → Scrapers neu laden
        self._entscheidungen_verarbeiten()

        # 3. StrategieAgent (1x täglich) → Suchstrategie optimieren
        if self.ki_enabled and self.strategie_agent and self.strategie_agent.soll_ausfuehren():
            try:
                logger.info("→ KI-Strategie-Analyse...")
                statistik = self.db.statistik_heute()
                bisherige = self.db.top_listings_heute(50)
                plan = self.strategie_agent.analysieren(statistik, bisherige)
                if plan:
                    self._strategie_vorschlag_senden(plan)
            except Exception as e:
                logger.error(f"Fehler bei Strategie-Agent: {e}")

        # 4. Alle Scraper (statisch + dynamisch) → Listings holen
        suchbegriffe = self._get_suchbegriffe()
        regionen = self._get_regionen()
        neue_ergebnisse = 0
        fehler = 0
        scraper_ergebnisse = {}

        for scraper in self.scrapers:
            try:
                logger.info(f"→ Scraper: {scraper.name}")
                scrape_start = time.time()

                relevante_begriffe = suchbegriffe[:8]
                relevante_regionen = regionen[:3]

                listings = scraper.alle_suchen(relevante_begriffe, relevante_regionen)

                # 5. scrape_log protokollieren
                scrape_dauer = time.time() - scrape_start
                self.db.scrape_log_eintragen(
                    plattform_name=scraper.name,
                    dauer_sekunden=scrape_dauer,
                    ergebnis_anzahl=len(listings),
                )

                # Nur Anzeigen nicht älter als X Stunden (z. B. 5)
                max_alter = (
                    self.config.get("suchgebiet", {}).get("max_alter_stunden")
                    or 0
                )
                if max_alter > 0:
                    vorher = len(listings)
                    listings = [l for l in listings if ist_nicht_aelter_als_stunden(l, max_alter)]
                    if vorher > len(listings):
                        logger.info(
                            f"Alter-Filter: {vorher - len(listings)} Anzeigen "
                            f"älter als {max_alter}h entfernt, {len(listings)} übrig"
                        )

                # Dedup via Database
                neue_listings = [l for l in listings if not self.db.existiert(l.url_hash)]
                if not neue_listings:
                    continue

                # 6. SuchAgent → KI-Bewertung
                if self.ki_enabled and self.such_agent:
                    logger.info(f"  → KI-Bewertung für {len(neue_listings)} neue Listings...")
                    ergebnisse = self.such_agent.suchen_und_bewerten(neue_listings)
                else:
                    ergebnisse = [self.scorer.bewerten(l) for l in neue_listings]

                relevante_count = 0
                for ergebnis in ergebnisse:
                    # 7. OutreachAgent → Nachrichten generieren
                    if ergebnis.ist_relevant:
                        if self.ki_enabled and self.outreach_agent:
                            ergebnis.antwort_vorschlag = self.outreach_agent.nachricht_erstellen(
                                ergebnis
                            )
                        else:
                            ergebnis.antwort_vorschlag = self.response_gen.generieren(
                                ergebnis
                            )
                        relevante_count += 1

                    # 8. DB speichern + Telegram senden
                    self.db.speichern(
                        url_hash=ergebnis.listing.url_hash,
                        url=ergebnis.listing.url,
                        titel=ergebnis.listing.titel,
                        beschreibung=ergebnis.listing.beschreibung,
                        ort=ergebnis.listing.ort,
                        quelle=ergebnis.listing.quelle.value,
                        kategorie=ergebnis.kategorie.value,
                        score=ergebnis.score_gesamt,
                        prioritaet=ergebnis.prioritaet.value,
                        antwort_vorschlag=ergebnis.antwort_vorschlag or "",
                    )

                    if ergebnis.ist_relevant:
                        self.telegram.senden_sync(ergebnis)
                        neue_ergebnisse += 1
                        time.sleep(1.5)

                # scrape_log mit relevanten Ergebnissen aktualisieren
                self.db.scrape_log_eintragen(
                    plattform_name=scraper.name,
                    ergebnis_anzahl=len(neue_listings),
                    relevante_anzahl=relevante_count,
                    dauer_sekunden=time.time() - scrape_start,
                )

                # Für LernAgent merken
                scraper_ergebnisse[scraper.name] = {
                    "ergebnisse": len(neue_listings),
                    "relevante": relevante_count,
                }

            except Exception as e:
                logger.error(f"Fehler bei Scraper {scraper.name}: {e}")
                fehler += 1
                self.db.scrape_log_eintragen(
                    plattform_name=scraper.name,
                    fehler_text=str(e),
                )

        # 9. LernAgent → Metriken aggregieren
        if self.lern_agent:
            try:
                vorschlaege = self.lern_agent.nach_durchlauf({
                    "scraper_ergebnisse": scraper_ergebnisse,
                })
                if vorschlaege:
                    entscheidung_ids = self.lern_agent.deaktivierung_vorschlagen(vorschlaege)
                    for eid in entscheidung_ids:
                        entscheidung = self.db.entscheidung_laden(eid)
                        if entscheidung:
                            self._entscheidung_an_telegram(
                                eid,
                                entscheidung["titel"],
                                entscheidung.get("beschreibung", ""),
                            )
            except Exception as e:
                logger.error(f"Fehler bei Lern-Agent: {e}")

        # 10. Token-Verbrauch loggen
        if self.ki_enabled and self.ki_client and self.ki_client.ist_verfuegbar:
            verbrauch = self.ki_client.token_verbrauch_heute()
            if verbrauch:
                logger.info(f"KI-Token-Verbrauch heute: {verbrauch}")

        logger.info(
            f"Durchlauf beendet: {neue_ergebnisse} neue relevante Ergebnisse, "
            f"{fehler} Fehler"
        )

        if fehler > 0:
            import asyncio
            try:
                loop = asyncio.new_event_loop()
                try:
                    loop.run_until_complete(
                        self.telegram.fehler_melden(
                            f"Durchlauf hatte {fehler} Scraper-Fehler. "
                            f"Details im Log."
                        )
                    )
                finally:
                    loop.close()
            except Exception:
                pass

    def _entscheidungen_verarbeiten(self):
        """Verarbeitet genehmigte Entscheidungen."""
        # Abgelaufene Entscheidungen schließen
        timeout = self.config.get("telegram", {}).get("entscheidung_timeout_stunden", 48)
        self.db.entscheidungen_abgelaufene_schliessen(timeout)

        # Genehmigte verarbeiten
        genehmigte = self.db.entscheidungen_genehmigt_unverarbeitet()
        for entscheidung in genehmigte:
            try:
                self._entscheidung_ausfuehren(entscheidung)
            except Exception as e:
                logger.error(f"Fehler beim Verarbeiten von Entscheidung #{entscheidung['id']}: {e}")

    def _entscheidung_ausfuehren(self, entscheidung: dict):
        """Führt eine genehmigte Entscheidung aus."""
        typ = entscheidung.get("typ", "")
        daten = entscheidung.get("daten_json", {}) or {}

        if typ == "plattform_neu":
            # Plattform aktivieren
            name = daten.get("plattform_name", "")
            if name:
                self.db.plattform_status_setzen(name, "aktiv")
                # Dynamische Scraper neu laden
                self.scrapers = self._init_scrapers()
                logger.info(f"Plattform '{name}' aktiviert und Scraper neu geladen")

                self.db.aktion_loggen(
                    "main",
                    "plattform_aktiviert",
                    details=name,
                )

        elif typ == "strategie_plan":
            # Suchbegriffe anpassen (nur bei genehmigten Plänen)
            neue = daten.get("neue_suchbegriffe", [])
            if neue:
                logger.info(f"Strategie: {len(neue)} neue Suchbegriffe genehmigt (manuell in Config eintragen)")
                self.db.aktion_loggen(
                    "main",
                    "strategie_genehmigt",
                    details=f"Neue Begriffe: {neue}",
                )

        elif typ == "suchbegriff_aenderung":
            logger.info(f"Deaktivierungs-Vorschlag genehmigt: {daten.get('schluessel', '?')}")
            self.db.aktion_loggen(
                "main",
                "deaktivierung_genehmigt",
                details=f"{daten.get('schluessel', '?')}: {daten.get('grund', '')}",
            )

        # Entscheidung als verarbeitet markieren (Status bleibt 'genehmigt', kein Re-Processing)
        # Wir setzen einen speziellen Status damit sie nicht nochmal verarbeitet wird
        self.db.entscheidung_aktualisieren(entscheidung["id"], "verarbeitet")

    def _entscheidung_an_telegram(self, entscheidung_id: int, titel: str, beschreibung: str):
        """Sendet eine Entscheidung an Telegram (interaktiv oder einfach)."""
        if self.telegram_interaktiv:
            msg_id = self.telegram_interaktiv.entscheidung_senden(
                entscheidung_id, titel, beschreibung
            )
            if msg_id:
                self.db.entscheidung_telegram_id_setzen(entscheidung_id, msg_id)
        else:
            # Fallback: Einfache Nachricht ohne Buttons
            import asyncio
            text = (
                f"<b>Vorschlag</b>\n\n"
                f"<b>{titel}</b>\n"
                f"{beschreibung[:500]}\n\n"
                f"<i>(Interaktiver Modus nicht aktiv – manuell in DB genehmigen)</i>"
            )
            try:
                if self.telegram.bot and self.telegram.chat_id:
                    loop = asyncio.new_event_loop()
                    try:
                        loop.run_until_complete(
                            self.telegram.bot.send_message(
                                chat_id=self.telegram.chat_id,
                                text=text,
                                parse_mode="HTML",
                            )
                        )
                    finally:
                        loop.close()
            except Exception as e:
                logger.error(f"Fehler beim Senden des Vorschlags: {e}")

    def _on_entscheidung(self, entscheidung_id: int, entscheidung: dict):
        """Callback wenn eine Entscheidung via Telegram genehmigt wird."""
        logger.info(f"Entscheidung #{entscheidung_id} via Telegram genehmigt")
        try:
            self._entscheidung_ausfuehren(entscheidung)
        except Exception as e:
            logger.error(f"Fehler beim Ausführen der Entscheidung: {e}")

    def _strategie_vorschlag_senden(self, plan):
        """Sendet Strategie-Vorschläge via Telegram."""
        import asyncio

        text = (
            "<b>KI-Strategie-Vorschlag</b>\n\n"
            f"<b>Neue Suchbegriffe:</b>\n"
        )
        for b in plan.neue_suchbegriffe[:5]:
            text += f"  + {b}\n"
        if plan.deaktivierte_begriffe:
            text += f"\n<b>Vorschlag deaktivieren:</b>\n"
            for b in plan.deaktivierte_begriffe[:5]:
                text += f"  - {b}\n"
        if plan.plattform_empfehlungen:
            text += f"\n<b>Plattform-Empfehlungen:</b>\n"
            for p in plan.plattform_empfehlungen[:3]:
                text += f"  > {p.get('name', '?')}: {p.get('begruendung', '')[:80]}\n"
        if plan.begruendung:
            text += f"\n<i>{plan.begruendung[:300]}</i>"

        # Entscheidung erstellen für Strategie-Plan
        entscheidung_id = self.db.entscheidung_erstellen(
            typ="strategie_plan",
            titel="Strategie-Optimierung",
            beschreibung=text,
            daten_json={
                "neue_suchbegriffe": plan.neue_suchbegriffe,
                "deaktivierte_begriffe": plan.deaktivierte_begriffe,
                "plattform_empfehlungen": plan.plattform_empfehlungen,
            },
        )

        self._entscheidung_an_telegram(
            entscheidung_id,
            "Strategie-Optimierung",
            text,
        )

    def tages_zusammenfassung_senden(self):
        """Sendet die tägliche Zusammenfassung."""
        statistik = self.db.statistik_heute()
        top = self.db.top_listings_heute(3)
        self.telegram.zusammenfassung_sync(statistik, top)
        logger.info("Tages-Zusammenfassung gesendet")

    def starten(self, einmal: bool = False):
        """Startet den Agenten mit oder ohne Scheduler."""
        # Interaktiven Telegram-Bot starten (Background-Thread)
        if self.telegram_interaktiv and not einmal:
            self.telegram_interaktiv.starten()

        self.durchlauf()

        if einmal:
            logger.info("Einmal-Modus: Beende nach erstem Durchlauf.")
            self.db.close()
            return

        intervall = self.config.get("scraper", {}).get("intervall_minuten", 30)
        schedule.every(intervall).minutes.do(self.durchlauf)

        zusammenfassung_zeit = (
            self.config.get("telegram", {}).get(
                "tages_zusammenfassung_uhrzeit", "20:00"
            )
        )
        schedule.every().day.at(zusammenfassung_zeit).do(
            self.tages_zusammenfassung_senden
        )

        cleanup_tage = self.config.get("datenbank", {}).get("cleanup_tage", 30)
        schedule.every().day.at("03:00").do(self.db.cleanup, tage=cleanup_tage)

        logger.info(f"Scheduler gestartet: alle {intervall} Min.")
        logger.info(f"Tages-Zusammenfassung: {zusammenfassung_zeit}")
        logger.info("Drücke Ctrl+C zum Beenden.")

        def shutdown(signum, frame):
            logger.info("Shutdown-Signal empfangen...")
            self._running = False

        signal.signal(signal.SIGINT, shutdown)
        signal.signal(signal.SIGTERM, shutdown)

        while self._running:
            schedule.run_pending()
            time.sleep(1)

        # Aufräumen
        if self.telegram_interaktiv:
            self.telegram_interaktiv.stoppen()
        logger.info("Agent beendet.")
        self.db.close()


def test_telegram(config_pfad: str = "config.yaml"):
    """Sendet eine Test-Nachricht an Telegram."""
    import asyncio

    config_path = ROOT / config_pfad
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    notifier = TelegramNotifier(config)

    async def _test():
        if notifier.bot:
            await notifier.bot.send_message(
                chat_id=notifier.chat_id,
                text=(
                    "<b>SE Handwerk Agent - Testmeldung</b>\n\n"
                    "Die Telegram-Verbindung funktioniert!\n"
                    f"Zeitpunkt: {datetime.now().strftime('%d.%m.%Y %H:%M:%S')}"
                ),
                parse_mode="HTML",
            )
            print("Test-Nachricht erfolgreich gesendet!")
        else:
            print("FEHLER: Bot nicht initialisiert. Token prüfen!")

    asyncio.run(_test())


def main():
    parser = argparse.ArgumentParser(
        description="SE Handwerk - Autonomer Akquise-Agent"
    )
    parser.add_argument(
        "--einmal",
        action="store_true",
        help="Einmaliger Durchlauf ohne Scheduler",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test-Nachricht an Telegram senden",
    )
    parser.add_argument(
        "--config",
        default="config.yaml",
        help="Pfad zur Config-Datei (Standard: config.yaml)",
    )

    args = parser.parse_args()

    if args.test:
        test_telegram(args.config)
        return

    agent = AkquiseAgent(args.config, einmal=args.einmal)
    agent.starten(einmal=args.einmal)


if __name__ == "__main__":
    main()
