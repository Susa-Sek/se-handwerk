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
from ki.strategie_agent import StrategieAgent
from ki.such_agent import SuchAgent
from ki.outreach_agent import OutreachAgent
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
from utils.standort_filter import ist_im_einzugsgebiet

# .env laden (liegt im Projekt-Root, eine Ebene über agent/)
PROJEKT_ROOT = ROOT.parent
load_dotenv(PROJEKT_ROOT / ".env")

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

        # KI-Agenten initialisieren
        self.ki_enabled = self.config.get("ki", {}).get("enabled", False)
        if self.ki_enabled:
            self.ki_client = KIClient(self.config)
            self.strategie_agent = StrategieAgent(self.ki_client, self.config)
            self.such_agent = SuchAgent(self.ki_client, self.config)
            self.outreach_agent = OutreachAgent(self.ki_client, self.config)
            logger.info(f"KI-Agenten aktiviert (Client verfügbar: {self.ki_client.ist_verfuegbar})")
        else:
            self.ki_client = None
            self.strategie_agent = None
            self.such_agent = None
            self.outreach_agent = None

        logger.info("=" * 50)
        logger.info("SE Handwerk Akquise-Agent gestartet")
        logger.info(f"Aktive Scraper: {[s.name for s in self.scrapers]}")
        logger.info(f"KI-Agenten: {'aktiviert' if self.ki_enabled else 'deaktiviert'}")
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

        # 1. StrategieAgent (1x täglich)
        if self.ki_enabled and self.strategie_agent and self.strategie_agent.soll_ausfuehren():
            try:
                logger.info("→ KI-Strategie-Analyse...")
                statistik = self.db.statistik_heute()
                bisherige = self.db.top_listings_heute(50)
                plan = self.strategie_agent.analysieren(statistik, bisherige)
                if plan:
                    auto_anwenden = self.config.get("ki", {}).get("strategie", {}).get("auto_anwenden", False)
                    if auto_anwenden:
                        # Self-Improvement: Neue Suchbegriffe direkt anwenden
                        self._strategie_anwenden(plan)
                    # Immer via Telegram senden
                    self._strategie_vorschlag_senden(plan)
            except Exception as e:
                logger.error(f"Fehler bei Strategie-Agent: {e}")

        # 2. Scraper holen Listings (wie bisher)
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

                # Standort-Filter: Nur Listings im Einzugsgebiet
                vorher = len(listings)
                listings = [l for l in listings if ist_im_einzugsgebiet(l, self.config)[0]]
                if vorher > len(listings):
                    logger.info(
                        f"Standort-Filter: {vorher - len(listings)} Anzeigen "
                        f"außerhalb Einzugsgebiet entfernt, {len(listings)} übrig"
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

                # 3. Dedup via Database (wie bisher)
                neue_listings = [l for l in listings if not self.db.existiert(l.url_hash)]
                if not neue_listings:
                    continue

                # 4. SuchAgent bewertet neue Listings per GPT (mit Fallback)
                if self.ki_enabled and self.such_agent:
                    logger.info(f"  → KI-Bewertung für {len(neue_listings)} neue Listings...")
                    ergebnisse = self.such_agent.suchen_und_bewerten(neue_listings)
                else:
                    ergebnisse = [self.scorer.bewerten(l) for l in neue_listings]

                for ergebnis in ergebnisse:
                    # 5. OutreachAgent erstellt Nachrichten für relevante Leads
                    if ergebnis.ist_relevant:
                        if self.ki_enabled and self.outreach_agent:
                            ergebnis.antwort_vorschlag = self.outreach_agent.nachricht_erstellen(
                                ergebnis
                            )
                        else:
                            ergebnis.antwort_vorschlag = self.response_gen.generieren(
                                ergebnis
                            )

                    # 7. Database speichern (inkl. KI-Begründung)
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

                    # 6. Telegram-Benachrichtigung mit KI-Nachricht + Score + Begründung
                    if ergebnis.ist_relevant:
                        self.telegram.senden_sync(ergebnis)
                        neue_ergebnisse += 1
                        time.sleep(1.5)

            except Exception as e:
                logger.error(f"Fehler bei Scraper {scraper.name}: {e}")
                fehler += 1

        # Token-Verbrauch loggen
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
                asyncio.run(
                    self.telegram.fehler_melden(
                        f"Durchlauf hatte {fehler} Scraper-Fehler. "
                        f"Details im Log."
                    )
                )
            except Exception:
                pass

    def _strategie_anwenden(self, plan):
        """Wendet Strategie-Vorschläge automatisch an (Self-Improvement)."""
        import yaml

        # Neue Suchbegriffe hinzufügen
        if plan.neue_suchbegriffe:
            aktuelle = self.config.get("suchbegriffe", {})
            # Neue Begriffe zur Kategorie "sonstiges" hinzufügen oder neue Kategorie
            if "ki_vorschlaege" not in aktuelle:
                aktuelle["ki_vorschlaege"] = []
            for begriff in plan.neue_suchbegriffe[:5]:  # Max 5 neue
                if begriff not in aktuelle["ki_vorschlaege"]:
                    aktuelle["ki_vorschlaege"].append(begriff)
                    logger.info(f"Neuer Suchbegriff hinzugefügt: {begriff}")
            self.config["suchbegriffe"] = aktuelle

            # Config speichern
            config_path = ROOT / "config.yaml"
            try:
                with open(config_path, "w", encoding="utf-8") as f:
                    yaml.safe_dump(self.config, f, allow_unicode=True, default_flow_style=False)
                logger.info("Strategie-Änderungen in config.yaml gespeichert")
            except Exception as e:
                logger.error(f"Konnte config.yaml nicht speichern: {e}")

    def _strategie_vorschlag_senden(self, plan):
        """Sendet Strategie-Vorschläge via Telegram."""
        text = (
            "🧠 <b>KI-Strategie-Vorschlag</b>\n\n"
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
                if isinstance(p, dict):
                    text += f"  → {p.get('name', '?')}: {p.get('begruendung', '')[:80]}\n"
                else:
                    text += f"  → {str(p)}\n"
        if plan.begruendung:
            text += f"\n<i>{plan.begruendung[:300]}</i>"

        try:
            if self.telegram.send_strategie(text):
                logger.info("Strategie-Vorschlag via Telegram gesendet")
        except Exception as e:
            logger.error(f"Fehler beim Senden des Strategie-Vorschlags: {e}")

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
