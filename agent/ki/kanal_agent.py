"""KI-Agent 4: Kanal-Entdeckung – findet autonom neue Plattformen."""

import json
import time
from datetime import datetime, timedelta
from typing import Optional

import requests

from database import Database
from ki.client import KIClient
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.ki.kanal")

SYSTEM_PROMPT = """Du bist ein Plattform-Scout für SE Handwerk, ein Handwerksbetrieb in Heilbronn.
SE Handwerk sucht Aufträge für: Bodenarbeiten (Laminat, Vinyl), Möbelmontage (IKEA, Homegym), Wohnungsübergabe.
Region: Heilbronn + 100 km Umkreis.

Deine Aufgabe: Finde deutsche Online-Plattformen wo Privatpersonen Handwerker-Aufträge ausschreiben.

Antworte IMMER als JSON mit folgender Struktur:
{
    "plattformen": [
        {
            "name": "kurzname (klein, ohne Leerzeichen)",
            "url": "https://...",
            "beschreibung": "Was die Plattform bietet",
            "relevanz": "hoch/mittel/niedrig",
            "such_url_hinweis": "Wie die Suche funktioniert (URL-Muster wenn bekannt)"
        }
    ]
}

Regeln:
- Nur DEUTSCHE Plattformen (deutschsprachig, für deutschen Markt)
- Nur Plattformen wo AUFTRÄGE/GESUCHE gepostet werden (keine reinen Firmenseiten)
- Bewerte Relevanz für Handwerker-Aufträge im Bereich Boden/Montage/Renovierung
- Berücksichtige: Kleinanzeigen, MyHammer, nebenan.de, markt.de, Blauarbeit, Check24, MachDuDas, etc.
"""

SELEKTOR_SYSTEM_PROMPT = """Du bist ein Web-Scraping-Experte. Analysiere den HTML-Code einer Suchergebnis-Seite
und identifiziere CSS-Selektoren für die wichtigsten Elemente.

Antworte IMMER als JSON:
{
    "such_url_template": "{basis_url}/suche?q={suchbegriff}&ort={region}",
    "selektoren": {
        "container": "CSS-Selektor für einen einzelnen Ergebnis-Container",
        "titel": "CSS-Selektor für den Titel innerhalb des Containers",
        "link": "CSS-Selektor für das Link-Element (mit href)",
        "beschreibung": "CSS-Selektor für die Beschreibung",
        "ort": "CSS-Selektor für den Ort",
        "datum": "CSS-Selektor für das Datum (optional)"
    }
}

Regeln:
- Selektoren müssen relativ zum Container sein
- Bevorzuge stabile Selektoren (Klassen, Daten-Attribute) statt Positionen
- such_url_template: Nutze {basis_url}, {suchbegriff}, {region} als Platzhalter
- Falls keine Such-URL erkennbar: nutze das URL-Muster der aktuellen Seite
"""


class KanalAgent:
    """Autonomer KI-Agent für Plattform-Entdeckung.

    Läuft wöchentlich, entdeckt neue Plattformen via Claude + HTTP-Probing,
    generiert Scraper-Konfigurationen und erstellt Genehmigungsanfragen.
    """

    def __init__(self, ki_client: KIClient, config: dict, db: Database):
        self.ki = ki_client
        self.config = config
        self.db = db
        self._modell = config.get("ki", {}).get("strategie_modell", "claude-sonnet-4-20250514")
        self._kanal_config = config.get("ki", {}).get("kanal_agent", {})
        self._max_neue = self._kanal_config.get("max_neue_pro_woche", 3)
        self._auto_testen = self._kanal_config.get("auto_testen", True)
        self._genehmigung_erforderlich = self._kanal_config.get("genehmigung_erforderlich", True)
        self._letzter_lauf: Optional[datetime] = None

    def soll_ausfuehren(self) -> bool:
        """Prüft ob die Kanal-Suche diese Woche schon gelaufen ist."""
        if self._letzter_lauf is None:
            return True
        tage_seit_lauf = (datetime.now() - self._letzter_lauf).days
        return tage_seit_lauf >= 7

    def entdecken(self) -> list[dict]:
        """Entdeckt neue Plattformen autonom.

        Returns:
            Liste von neu vorgeschlagenen Plattformen.
        """
        if not self.ki.ist_verfuegbar:
            logger.info("KI nicht verfügbar – Kanal-Entdeckung übersprungen")
            return []

        self._letzter_lauf = datetime.now()
        self.db.aktion_loggen("kanal_agent", "entdeckung_gestartet")

        # 1. Bekannte Plattformen laden
        bekannte = self.db.plattformen_laden()
        bekannte_namen = {p["name"].lower() for p in bekannte}
        bekannte_urls = {p["basis_url"].lower().rstrip("/") for p in bekannte}

        # Auch statisch konfigurierte Scraper berücksichtigen
        statische = {"kleinanzeigen", "myhammer", "google", "facebook", "nebenan", "markt"}
        bekannte_namen.update(statische)

        # 2. Claude nach neuen Plattformen fragen
        kandidaten = self._plattformen_suchen(bekannte_namen)
        if not kandidaten:
            logger.info("Keine neuen Plattform-Kandidaten gefunden")
            return []

        neue_plattformen = []
        getestet = 0

        for kandidat in kandidaten:
            if getestet >= self._max_neue:
                break

            name = kandidat.get("name", "").lower().strip()
            url = kandidat.get("url", "").strip().rstrip("/")

            if not name or not url:
                continue

            if name in bekannte_namen or url.lower() in bekannte_urls:
                logger.debug(f"Plattform '{name}' bereits bekannt – übersprungen")
                continue

            # 3. HTTP-Probe
            erreichbar = self._http_probe(url)
            if not erreichbar:
                logger.info(f"Plattform '{name}' nicht erreichbar: {url}")
                continue

            getestet += 1

            # 4. Scraper-Config generieren (optional)
            scraper_config = None
            if self._auto_testen:
                scraper_config = self._selektoren_generieren(name, url)

            # 5. In DB speichern
            plattform_id = self.db.plattform_speichern(
                name=name,
                basis_url=url,
                typ="entdeckt",
                scraper_config=scraper_config,
                status="vorgeschlagen",
                entdeckt_von="kanal_agent",
                notizen=kandidat.get("beschreibung", ""),
            )

            if plattform_id:
                # 6. Entscheidung erstellen
                beschreibung = (
                    f"Plattform: {name}\n"
                    f"URL: {url}\n"
                    f"Relevanz: {kandidat.get('relevanz', '?')}\n"
                    f"Beschreibung: {kandidat.get('beschreibung', '')}\n"
                )
                if scraper_config:
                    beschreibung += "\nScraper-Konfiguration wurde automatisch erstellt."

                entscheidung_id = self.db.entscheidung_erstellen(
                    typ="plattform_neu",
                    titel=f"Neue Plattform: {name}",
                    beschreibung=beschreibung,
                    daten_json={
                        "plattform_name": name,
                        "basis_url": url,
                        "scraper_config": scraper_config,
                        "kandidat": kandidat,
                    },
                )

                neue_plattformen.append({
                    "name": name,
                    "url": url,
                    "entscheidung_id": entscheidung_id,
                    "beschreibung": beschreibung,
                    "scraper_config": scraper_config,
                })

                self.db.aktion_loggen(
                    "kanal_agent",
                    "plattform_vorgeschlagen",
                    details=f"{name}: {url}",
                    daten_json=kandidat,
                )

        logger.info(f"Kanal-Entdeckung: {len(neue_plattformen)} neue Plattformen vorgeschlagen")
        return neue_plattformen

    def _plattformen_suchen(self, bekannte_namen: set) -> list[dict]:
        """Fragt Claude nach neuen Plattformen."""
        bekannte_liste = ", ".join(sorted(bekannte_namen))

        user_prompt = (
            f"Welche deutschen Plattformen für Handwerker-Aufträge fehlen uns noch?\n\n"
            f"Bereits bekannt/genutzt: {bekannte_liste}\n\n"
            f"Suche speziell nach Plattformen wo Privatpersonen Aufträge für "
            f"Bodenarbeiten, Möbelmontage und Renovierung ausschreiben.\n\n"
            f"Finde bis zu {self._max_neue} neue relevante Plattformen."
        )

        antwort = self.ki.anfrage(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=800,
            agent_name="kanal",
        )

        if not antwort:
            return []

        try:
            daten = json.loads(antwort)
            return daten.get("plattformen", [])
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            logger.error(f"Fehler beim Parsen der Plattform-Antwort: {e}")
            return []

    def _http_probe(self, url: str) -> bool:
        """Prüft ob eine URL erreichbar ist und robots.txt erlaubt."""
        try:
            # Basis-URL testen
            response = requests.get(
                url,
                timeout=10,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; SEHandwerkBot/1.0)",
                    "Accept": "text/html",
                },
                allow_redirects=True,
            )
            if response.status_code >= 400:
                return False

            # robots.txt prüfen (informativ, nicht blockierend)
            robots_url = url.rstrip("/") + "/robots.txt"
            try:
                robots = requests.get(robots_url, timeout=5)
                if robots.status_code == 200:
                    text = robots.text.lower()
                    if "disallow: /" in text and "user-agent: *" in text:
                        logger.info(f"robots.txt verbietet Zugriff auf {url}")
                        return False
            except Exception:
                pass

            return True

        except requests.exceptions.RequestException as e:
            logger.debug(f"HTTP-Probe fehlgeschlagen für {url}: {e}")
            return False

    def _selektoren_generieren(self, name: str, basis_url: str) -> Optional[dict]:
        """Generiert CSS-Selektoren für eine Plattform via Claude."""
        # Versuche eine Such-Seite zu laden
        test_begriffe = ["Laminat verlegen", "Möbel montieren"]
        html_snippet = None

        for begriff in test_begriffe:
            try:
                # Verbreitete URL-Muster für Suchseiten
                such_urls = [
                    f"{basis_url}/suche?q={requests.utils.quote(begriff)}",
                    f"{basis_url}/search?q={requests.utils.quote(begriff)}",
                    f"{basis_url}/s/{requests.utils.quote(begriff)}",
                ]
                for such_url in such_urls:
                    response = requests.get(
                        such_url,
                        timeout=10,
                        headers={
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                                          "Chrome/120.0.0.0 Safari/537.36",
                            "Accept-Language": "de-DE,de;q=0.9",
                        },
                    )
                    if response.status_code == 200 and len(response.text) > 500:
                        html_snippet = response.text[:5000]
                        break
                if html_snippet:
                    break
                time.sleep(1)
            except Exception:
                continue

        if not html_snippet:
            logger.info(f"Konnte keine Such-Seite für {name} laden")
            return None

        # Claude fragt nach Selektoren
        user_prompt = (
            f"Analysiere den HTML-Code dieser Suchergebnis-Seite von '{name}' ({basis_url}).\n\n"
            f"HTML (gekürzt):\n```html\n{html_snippet}\n```\n\n"
            f"Identifiziere CSS-Selektoren für die Suchergebnisse."
        )

        antwort = self.ki.anfrage(
            system_prompt=SELEKTOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            modell=self._modell,
            json_mode=True,
            max_tokens=600,
            agent_name="kanal",
        )

        if not antwort:
            return None

        try:
            config = json.loads(antwort)
            if "selektoren" in config and "container" in config.get("selektoren", {}):
                logger.info(f"Selektoren für '{name}' generiert")
                return config
        except (json.JSONDecodeError, KeyError, TypeError):
            pass

        logger.warning(f"Konnte keine Selektoren für '{name}' generieren")
        return None
