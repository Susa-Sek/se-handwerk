"""B2B-Recherche: Findet Immobilien-Unternehmen und extrahiert Kontaktdaten.

Quellen:
  1. Gelbe Seiten (gelbeseiten.de) — strukturiert, Firma + Website + Tel
  2. Google Search — findet weitere Firmenwebsites
  3. Impressum-Crawler — besucht Websites, extrahiert E-Mail aus /impressum

Strategie: Jede deutsche Firmenwebsite braucht gesetzlich ein Impressum (TMG §5)
mit Kontaktdaten. Daher ist /impressum die zuverlässigste E-Mail-Quelle.
"""

import re
import time
import random
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

from models import B2BKontakt, B2BKontaktTyp
from utils.logger import setup_logger

logger = setup_logger("se_handwerk.b2b.recherche")

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b')
TEL_REGEX   = re.compile(r'(?:\+49|0)[\s\-]?\d{2,5}[\s\-]?\d{3,8}[\s\-]?\d{0,6}')

# Gelbe-Seiten-Suchkategorien pro B2B-Typ
GELBESEITEN_KATEGORIEN: dict[B2BKontaktTyp, list[str]] = {
    B2BKontaktTyp.HAUSVERWALTUNG: [
        "hausverwaltung", "immobilienverwaltung", "wohnungsverwaltung",
    ],
    B2BKontaktTyp.WOHNUNGSBAU: [
        "wohnungsbaugesellschaft", "wohnungsunternehmen", "wohnbau",
    ],
    B2BKontaktTyp.MAKLER: [
        "immobilienmakler", "immobilienbüro",
    ],
    B2BKontaktTyp.FACILITY: [
        "facility-management", "gebäudemanagement", "hausmeisterdienst",
    ],
    B2BKontaktTyp.UMZUG: [
        "umzugsunternehmen", "umzugsfirma",
    ],
}

# Google-Suchbegriffe pro Typ (ergänzend zu Gelbe Seiten)
GOOGLE_SUCHBEGRIFFE: dict[B2BKontaktTyp, list[str]] = {
    B2BKontaktTyp.HAUSVERWALTUNG: [
        "Hausverwaltung Heilbronn", "Immobilienverwaltung Heilbronn",
        "WEG-Verwaltung Heilbronn",
    ],
    B2BKontaktTyp.MAKLER: [
        "Immobilienmakler Heilbronn", "Immobilienbüro Heilbronn",
    ],
    B2BKontaktTyp.FACILITY: [
        "Facility Management Heilbronn", "Hausmeisterservice Heilbronn",
    ],
    B2BKontaktTyp.WOHNUNGSBAU: [
        "Wohnungsbaugesellschaft Heilbronn", "Wohnbau Heilbronn",
    ],
    B2BKontaktTyp.UMZUG: [
        "Umzugsunternehmen Heilbronn",
    ],
}

# Typische Pfade für Impressum/Kontakt
KONTAKT_PFADE = [
    "/impressum", "/impressum.html", "/impressum.php",
    "/kontakt", "/kontakt.html", "/contact",
    "/ueber-uns", "/über-uns", "/about",
    "/datenschutz",   # manchmal auch dort
]

# Wegwerfdomains filtern
SPAM_DOMAINS = {
    "gmail.com", "gmx.de", "gmx.net", "web.de", "hotmail.com",
    "yahoo.de", "yahoo.com", "t-online.de", "freenet.de",
    "example.com", "example.de",
}


def _ist_geschaeftliche_email(email: str) -> bool:
    domain = email.split("@")[-1].lower() if "@" in email else ""
    return domain not in SPAM_DOMAINS and "." in domain


class B2BRecherche:
    """Findet B2B-Kontakte in der Immobilienbranche für den Raum Heilbronn."""

    def __init__(self, config: dict):
        self.config = config
        self._b2b_cfg = config.get("b2b", {})
        self._session = requests.Session()
        self._ua = UserAgent()
        self._delay = config.get("scraper", {}).get("request_delay_sekunden", [2, 4])
        self._timeout = config.get("scraper", {}).get("timeout_sekunden", 15)

    def _headers(self) -> dict:
        return {
            "User-Agent": self._ua.random,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "de-DE,de;q=0.9",
            "DNT": "1",
        }

    def _get(self, url: str) -> Optional[str]:
        """HTTP-GET mit Rate-Limiting. Gibt HTML-Text oder None zurück."""
        try:
            time.sleep(random.uniform(self._delay[0], self._delay[1]))
            r = self._session.get(
                url, headers=self._headers(), timeout=self._timeout,
                allow_redirects=True,
            )
            if r.status_code == 200:
                return r.text
            if r.status_code == 429:
                logger.warning(f"Rate-Limit {url} – warte 20s")
                time.sleep(20)
            return None
        except Exception as e:
            logger.debug(f"GET fehlgeschlagen {url}: {e}")
            return None

    # ── Gelbe Seiten ────────────────────────────────────────────────────────

    def _gelbeseiten_suchen(
        self, kategorie: str, ort: str, typ: B2BKontaktTyp
    ) -> list[B2BKontakt]:
        """Scrapt eine Gelbe-Seiten-Ergebnisseite."""
        url = f"https://www.gelbeseiten.de/suche/{kategorie}/{ort}"
        html = self._get(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        kontakte: list[B2BKontakt] = []

        for treffer in soup.select("article.mod-Treffer"):
            try:
                # Firmenname
                name_el = treffer.select_one("p.mod-Treffer__name, h2.mod-Treffer__name")
                if not name_el:
                    continue
                firma = name_el.get_text(strip=True)

                # Adresse / Ort
                adr_el = treffer.select_one(".mod-AdresseKompakt, .mod-Treffer__adresse")
                ort_text = adr_el.get_text(" ", strip=True) if adr_el else ort

                # Website-Link
                web_el = treffer.select_one("a[href*='http'][class*='web'], a.mod-MiniMap--website")
                website = web_el.get("href", "").strip() if web_el else ""
                if not website:
                    # Fallback: data-url oder weiteres Link-Pattern
                    web_el2 = treffer.select_one("a[data-url]")
                    website = web_el2.get("data-url", "") if web_el2 else ""

                # Telefon
                tel_el = treffer.select_one("[class*='telefon'], [class*='phone']")
                telefon = tel_el.get_text(strip=True) if tel_el else None

                if not firma:
                    continue

                kontakte.append(B2BKontakt(
                    firma=firma[:120],
                    website=website,
                    email="",           # wird durch Impressum-Crawler ergänzt
                    typ=typ,
                    ort=ort_text[:80],
                    telefon=telefon,
                    quelle="gelbeseiten",
                ))
            except Exception as e:
                logger.debug(f"Gelbe-Seiten Parsing-Fehler: {e}")
                continue

        logger.info(f"Gelbe Seiten '{kategorie}/{ort}': {len(kontakte)} Einträge")
        return kontakte

    # ── Google Search ────────────────────────────────────────────────────────

    def _google_suchen(self, suchbegriff: str, typ: B2BKontaktTyp) -> list[B2BKontakt]:
        """Sucht via googlesearch-python und gibt Rohkontakte (ohne E-Mail) zurück."""
        try:
            from googlesearch import search as gsearch
        except ImportError:
            return []

        kontakte: list[B2BKontakt] = []
        max_results = self._b2b_cfg.get("google_max_results", 8)
        try:
            for url in gsearch(suchbegriff, num_results=max_results, lang="de"):
                domain = urlparse(url).netloc.replace("www.", "")
                # Aggregatoren / Verzeichnisse überspringen
                if any(skip in domain for skip in [
                    "gelbeseiten", "dasoertliche", "yelp", "google", "wikipedia",
                    "facebook", "xing", "linkedin", "immobilienscout",
                ]):
                    continue
                kontakte.append(B2BKontakt(
                    firma=domain,           # vorläufiger Name, wird aus Website extrahiert
                    website=url,
                    email="",
                    typ=typ,
                    ort="Heilbronn",
                    quelle="google",
                ))
        except Exception as e:
            logger.debug(f"Google-Suche '{suchbegriff}' fehlgeschlagen: {e}")

        logger.info(f"Google '{suchbegriff}': {len(kontakte)} URLs gefunden")
        return kontakte

    # ── Impressum-Crawler ────────────────────────────────────────────────────

    def _impressum_daten_extrahieren(
        self, website: str
    ) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Besucht /impressum (und Fallbacks) und extrahiert (firma, email, telefon).
        Gibt (None, None, None) zurück wenn nichts gefunden.
        """
        if not website or not website.startswith("http"):
            return None, None, None

        basis = f"{urlparse(website).scheme}://{urlparse(website).netloc}"

        for pfad in KONTAKT_PFADE:
            url = urljoin(basis, pfad)
            html = self._get(url)
            if not html:
                continue

            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(" ", strip=True)

            # E-Mail extrahieren
            emails = EMAIL_REGEX.findall(text)
            email = next(
                (e.lower() for e in emails if _ist_geschaeftliche_email(e)), None
            )
            if not email:
                # Auch in mailto-Links suchen
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if href.startswith("mailto:"):
                        addr = href[7:].split("?")[0].strip().lower()
                        if addr and _ist_geschaeftliche_email(addr):
                            email = addr
                            break

            # Firmenname: erstes <h1> oder <h2> auf der Seite
            firma = None
            for tag in soup.find_all(["h1", "h2"])[:3]:
                t = tag.get_text(strip=True)
                if t and len(t) > 3:
                    firma = t[:100]
                    break

            # Telefon
            tel_treffer = TEL_REGEX.findall(text)
            telefon = tel_treffer[0].strip() if tel_treffer else None

            if email:
                logger.debug(f"Impressum {url} → {email}")
                return firma, email, telefon

        return None, None, None

    # ── Hauptmethode ────────────────────────────────────────────────────────

    def recherchieren(
        self,
        regionen: list[str],
        typen: Optional[list[B2BKontaktTyp]] = None,
    ) -> list[B2BKontakt]:
        """
        Durchsucht Gelbe Seiten + Google, crawlt Impressums.
        Gibt Kontakte MIT E-Mail zurück (dedupliziert nach E-Mail).

        Ablauf:
          1. Gelbe Seiten → Liste von Firmen (ohne E-Mail)
          2. Google → weitere Firmen-URLs
          3. Für jede Firma: Impressum besuchen → E-Mail extrahieren
          4. Duplikate entfernen
        """
        if typen is None:
            typen = list(GELBESEITEN_KATEGORIEN.keys())

        rohkontakte: list[B2BKontakt] = []
        max_pro_typ = self._b2b_cfg.get("max_pro_typ", 15)

        for typ in typen:
            # Gelbe Seiten
            for region in regionen[:3]:
                for kategorie in GELBESEITEN_KATEGORIEN.get(typ, [])[:2]:
                    neue = self._gelbeseiten_suchen(kategorie, region.lower(), typ)
                    rohkontakte.extend(neue[:max_pro_typ])

            # Google
            for suchbegriff in GOOGLE_SUCHBEGRIFFE.get(typ, [])[:2]:
                neue = self._google_suchen(suchbegriff, typ)
                rohkontakte.extend(neue)

        # Duplikate auf Website-Ebene entfernen
        gesehene_domains: set[str] = set()
        einzigartige: list[B2BKontakt] = []
        for k in rohkontakte:
            domain = urlparse(k.website).netloc.replace("www.", "") if k.website else ""
            if domain and domain in gesehene_domains:
                continue
            gesehene_domains.add(domain)
            einzigartige.append(k)

        logger.info(f"B2B-Recherche: {len(einzigartige)} einzigartige Firmen gefunden, crawle Impressums…")

        # Impressum-Crawler: E-Mail + ggf. Firmenname ergänzen
        max_gesamt = self._b2b_cfg.get("max_kontakte_pro_lauf", 30)
        ergebnis: list[B2BKontakt] = []
        gesehene_emails: set[str] = set()

        for kontakt in einzigartige:
            if len(ergebnis) >= max_gesamt:
                break
            if not kontakt.website:
                continue

            firma_imp, email, telefon = self._impressum_daten_extrahieren(kontakt.website)

            if not email:
                continue
            if email in gesehene_emails:
                continue

            gesehene_emails.add(email)
            kontakt.email = email
            if firma_imp and kontakt.quelle == "google":
                kontakt.firma = firma_imp    # Google-Einträge hatten nur Domain als Namen
            if telefon and not kontakt.telefon:
                kontakt.telefon = telefon

            ergebnis.append(kontakt)

        logger.info(f"B2B-Recherche abgeschlossen: {len(ergebnis)} Kontakte mit E-Mail")
        return ergebnis
