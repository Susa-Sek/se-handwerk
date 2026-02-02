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
from models import Bewertungsergebnis, Prioritaet, Quelle
from notifications.telegram_bot import TelegramNotifier
from responses.generator import ResponseGenerator
from scrapers.kleinanzeigen import KleinanzeigenScraper
from scrapers.myhammer import MyHammerScraper
from scrapers.google_search import GoogleScraper
from scrapers.facebook import FacebookScraper
from scrapers.nebenan import NebenanScraper
from scrapers.markt import MarktScraper
from utils.date_parser import ist_nicht_aelter_als_stunden
from utils.logger import setup_logger

# .env laden
load_dotenv(ROOT / ".env")

logger = setup_logger("se_handwerk.main")


class AkquiseAgent:
    """Hauptklasse: Orchestriert Scraping, Scoring und Benachrichtigung."""

    def __init__(self, config_pfad: str = "config.yaml"):
        self.config = self._load_config(config_pfad)
        self.db = Database(self.config.get("datenbank", {}).get("pfad", "se_handwerk.db"))
        self.scorer = Scorer(self.config)
        self.telegram = TelegramNotifier(self.config)
        self.response_gen = ResponseGenerator(self.config)
        self.scrapers = self._init_scrapers()
        self._running = True

        logger.info("=" * 50)
        logger.info("SE Handwerk Akquise-Agent gestartet")
        logger.info(f"Aktive Scraper: {[s.name for s in self.scrapers]}")
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
        """Initialisiert alle aktivierten Scraper."""
        scrapers = []

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

        return scrapers

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
        logger.info("-" * 40)
        logger.info(f"Starte Durchlauf: {datetime.now().strftime('%H:%M:%S')}")

        suchbegriffe = self._get_suchbegriffe()
        regionen = self._get_regionen()
        neue_ergebnisse = 0
        fehler = 0

        for scraper in self.scrapers:
            try:
                logger.info(f"→ Scraper: {scraper.name}")

                relevante_begriffe = suchbegriffe[:8]
                relevante_regionen = regionen[:3]

                listings = scraper.alle_suchen(relevante_begriffe, relevante_regionen)

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

                for listing in listings:
                    if self.db.existiert(listing.url_hash):
                        continue

                    ergebnis = self.scorer.bewerten(listing)

                    if ergebnis.ist_relevant:
                        ergebnis.antwort_vorschlag = self.response_gen.generieren(
                            ergebnis
                        )

                    self.db.speichern(
                        url_hash=listing.url_hash,
                        url=listing.url,
                        titel=listing.titel,
                        beschreibung=listing.beschreibung,
                        ort=listing.ort,
                        quelle=listing.quelle.value,
                        kategorie=ergebnis.kategorie.value,
                        score=ergebnis.score_gesamt,
                        prioritaet=ergebnis.prioritaet.value,
                        antwort_vorschlag=ergebnis.antwort_vorschlag or "",
                    )

                    if ergebnis.ist_relevant:
                        self.telegram.senden_sync(ergebnis)
                        neue_ergebnisse += 1
                        time.sleep(1.5)

            except Exception as e:
                logger.error(f"Fehler bei Scraper {scraper.name}: {e}")
                fehler += 1

        logger.info(
            f"Durchlauf beendet: {neue_ergebnisse} neue relevante Ergebnisse, "
            f"{fehler} Fehler"
        )

        if fehler > 0:
            import asyncio
            try:
                asyncio.run(
                    self.telegram.fehler_melden(
                        f"Durchlauf hatte {fehler} Scraper-Fehler. "
                        f"Details im Log."
                    )
                )
            except Exception:
                pass

    def tages_zusammenfassung_senden(self):
        """Sendet die tägliche Zusammenfassung."""
        statistik = self.db.statistik_heute()
        top = self.db.top_listings_heute(3)
        self.telegram.zusammenfassung_sync(statistik, top)
        logger.info("Tages-Zusammenfassung gesendet")

    def starten(self, einmal: bool = False):
        """Startet den Agenten mit oder ohne Scheduler."""
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
                    "✅ <b>SE Handwerk Agent - Testmeldung</b>\n\n"
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

    agent = AkquiseAgent(args.config)
    agent.starten(einmal=args.einmal)


if __name__ == "__main__":
    main()
