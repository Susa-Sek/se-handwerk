# System um weitere Auftragskanäle erweitern

So baust du neue Quellen (z.B. nebenan.de, markt.de, lokale Portale) ein. Das System ist dafür vorbereitet: **neuer Scraper** → **in Config aktivieren** → **in main.py registrieren**.

---

## Übersicht: Was schon drin ist

| Kanal        | Datei                    | Config-Schlüssel | Status        |
|-------------|--------------------------|------------------|---------------|
| Kleinanzeigen | `scrapers/kleinanzeigen.py` | `kleinanzeigen`  | aktiv         |
| Google (Site-Suche) | `scrapers/google_search.py` | `google`   | aktiv         |
| MyHammer    | `scrapers/myhammer.py`    | `myhammer`       | deaktiviert (403) |
| Facebook    | `scrapers/facebook.py`   | `facebook`       | deaktiviert   |

---

## Neuen Kanal in 4 Schritten hinzufügen

### 1. Quelle in `models.py` eintragen

In **models.py** in der Enum **Quelle** einen neuen Wert ergänzen:

```python
class Quelle(Enum):
    KLEINANZEIGEN = "kleinanzeigen"
    MYHAMMER = "myhammer"
    GOOGLE = "google"
    FACEBOOK = "facebook"
    NEBENAN = "nebenan"      # Beispiel: neuer Kanal
```

---

### 2. Neuen Scraper anlegen

Neue Datei im Ordner **scrapers/** z.B. `nebenan.py` (oder `markt.py`, `lokalo.py` usw.).

**Basis-Template** – anpassen an die echte Such-URL und das HTML/API der Seite:

```python
"""Scraper für [Name der Plattform] – Auftragsgesuche."""

from datetime import datetime
from typing import Optional
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from models import Listing, Quelle
from scrapers.base import BaseScraper


class NebenanScraper(BaseScraper):
    """Durchsucht nebenan.de (oder anderes Portal) nach Handwerks-Gesuchen."""

    @property
    def name(self) -> str:
        return "nebenan"

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Sucht auf der Plattform. Gibt Liste von Listing zurück."""
        basis = self.config.get("nebenan", {}).get("basis_url", "https://www.nebenan.de")
        # URL bauen – je nach Portal (Suche, Kategorie, PLZ/Stadt)
        url = f"{basis}/suche?q={quote_plus(suchbegriff)}&ort={quote_plus(region)}"

        response = self._request(url)
        if not response:
            return []

        return self._parse_ergebnisse(response.text, suchbegriff)

    def _parse_ergebnisse(self, html: str, suchbegriff: str) -> list[Listing]:
        """HTML parsen, Liste von Listing-Objekten bauen."""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        # Selektoren anpassen (z.B. Artikel, Cards, Links)
        for elem in soup.select("div.result-item"):  # Platzhalter – echte Selektoren nutzen
            listing = self._parse_einzel(elem)
            if listing:
                listings.append(listing)

        self.logger.debug(f"{self.name}: {len(listings)} Listings für '{suchbegriff}'")
        return listings

    def _parse_einzel(self, elem) -> Optional[Listing]:
        """Ein Suchergebnis in ein Listing umwandeln."""
        try:
            link = elem.select_one("a[href]")
            if not link:
                return None
            href = link.get("href", "")
            if href and not href.startswith("http"):
                basis = self.config.get("nebenan", {}).get("basis_url", "https://www.nebenan.de")
                href = f"{basis.rstrip('/')}{href}"
            titel = link.get_text(strip=True) if link else ""
            beschreibung = ""
            desc = elem.select_one("p.description")
            if desc:
                beschreibung = desc.get_text(strip=True)
            ort = ""
            loc = elem.select_one("[data-location], .ort")
            if loc:
                ort = loc.get_text(strip=True)

            return Listing(
                url=href,
                titel=titel or "Ohne Titel",
                beschreibung=beschreibung,
                ort=ort,
                quelle=Quelle.NEBENAN,
                datum_gefunden=datetime.now(),
            )
        except Exception as e:
            self.logger.debug(f"Parse-Fehler: {e}")
            return None
```

Wichtig:

- **`name`** = kurzer Kanalname (für Logs).
- **`suchen(suchbegriff, region)`** = eine Suche durchführen, **Liste von `Listing`** zurückgeben.
- **`_request(url)`** kommt von **BaseScraper** (Rate-Limit, Retry, User-Agent).
- **`Listing`** braucht: `url`, `titel`, `beschreibung`, `ort`, `quelle`, optional `datum_inserat` (für Alter-Filter).

Die Methode **`alle_suchen(suchbegriffe, regionen)`** erbt du von **BaseScraper** – sie ruft für jede Kombination aus Suchbegriff und Region deine **`suchen()`** auf und dedupliziert nach URL.

---

### 3. Config in `config.yaml` ergänzen

Neuen Abschnitt für den Kanal anlegen (z.B. nach `kleinanzeigen`):

```yaml
nebenan:
  enabled: true
  basis_url: "https://www.nebenan.de"
  # Optionale Parameter (Radius, Max-Ergebnisse, etc.)
  max_ergebnisse: 20
```

Wenn du **nur Heilbronn/100 km** nutzt, bekommt dein Scraper in **`suchen(suchbegriff, region)`** nur **eine** Region (z.B. `"Heilbronn"`). Du kannst sie für URL oder Filter nutzen.

---

### 4. Scraper in `main.py` registrieren

In **main.py**:

1. Oben den neuen Scraper importieren:

```python
from scrapers.nebenan import NebenanScraper
```

2. In **`_init_scrapers()`** den neuen Kanal hinzufügen (z.B. nach Google):

```python
if self.config.get("nebenan", {}).get("enabled", False):
    scrapers.append(NebenanScraper(self.config))
```

Damit wird der neue Kanal bei jedem Durchlauf mit denselben Suchbegriffen und Regionen wie die anderen Scraper ausgeführt.

---

## Mögliche weitere Kanäle (Ideen)

| Kanal        | Typ        | Hinweis |
|-------------|------------|---------|
| **nebenan.de** | Nachbarschaft | Suche/Feed nach Ort; oft Login nötig für volle Ergebnisse |
| **markt.de**   | Kleinanzeigen | Ähnlich Kleinanzeigen, eigene URL-Struktur/HTML |
| **jobbörsen** (Handwerk) | Stellen | z.B. handwerk.com, regionale Portale – eher Stellen als Aufträge |
| **lokale Portale** | Stadt/Region | z.B. heilbronn.de, regionale Wirtschaftsportale |
| **Instagram/Facebook** | Social | Bereits Facebook-Scraper vorhanden; Instagram optional per API/Scraping |

Rechtlich und technisch: Nutzungsbedingungen und Robots.txt der jeweiligen Seite beachten; bei APIs (falls vorhanden) Rate-Limits einhalten.

---

## Kurz-Checkliste für einen neuen Kanal

1. **models.py**: `Quelle.NEUKANAL = "neukanal"`
2. **scrapers/neukanal.py**: Klasse von `BaseScraper`, `name` + `suchen()` + Parsing zu `Listing`.
3. **config.yaml**: Abschnitt `neukanal:` mit `enabled: true` und URLs/Parametern.
4. **main.py**: `from scrapers.neukanal import NeukanalScraper` und in `_init_scrapers()` prüfen `if config.get("neukanal", {}).get("enabled"): scrapers.append(NeukanalScraper(self.config))`.

Danach: `python main.py --einmal` testen; in den Logs siehst du den neuen Scraper und seine Ergebnisse.
