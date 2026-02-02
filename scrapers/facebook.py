"""Facebook Gruppen Scraper – durchsucht lokale Gruppen nach Handwerks-Gesuchen.

HINWEIS: Dieser Scraper benötigt einen gültigen Facebook-Session-Cookie.
Der Cookie muss manuell in der .env-Datei als FACEBOOK_SESSION_COOKIE hinterlegt werden.
Facebook ist standardmäßig deaktiviert (config: facebook.enabled = false).
"""

import os
from datetime import datetime
from typing import Optional

from models import Listing, Quelle
from scrapers.base import BaseScraper


class FacebookScraper(BaseScraper):
    """Durchsucht Facebook-Gruppen nach Handwerks-Gesuchen via Playwright."""

    @property
    def name(self) -> str:
        return "facebook"

    def __init__(self, config: dict):
        super().__init__(config)
        self.session_cookie = os.getenv("FACEBOOK_SESSION_COOKIE", "")
        self.gruppen_urls = config.get("facebook", {}).get("gruppen_urls", [])
        self._browser = None
        self._page = None

    async def _init_browser(self):
        """Initialisiert Playwright-Browser mit Facebook-Session."""
        if self._browser:
            return

        try:
            from playwright.async_api import async_playwright

            pw = await async_playwright().start()
            self._browser = await pw.chromium.launch(headless=True)
            context = await self._browser.new_context(
                locale="de-DE",
                user_agent=self.session.headers.get("User-Agent", ""),
            )

            # Session-Cookie setzen
            if self.session_cookie:
                await context.add_cookies([
                    {
                        "name": "c_user",
                        "value": self.session_cookie,
                        "domain": ".facebook.com",
                        "path": "/",
                    }
                ])

            self._page = await context.new_page()
            self.logger.info("Facebook-Browser initialisiert")

        except ImportError:
            self.logger.error(
                "playwright nicht installiert. "
                "Bitte installieren: pip install playwright && playwright install chromium"
            )
        except Exception as e:
            self.logger.error(f"Browser-Init fehlgeschlagen: {e}")

    def suchen(self, suchbegriff: str, region: str) -> list[Listing]:
        """Synchroner Wrapper für die Facebook-Suche."""
        if not self.gruppen_urls:
            self.logger.warning("Keine Facebook-Gruppen konfiguriert")
            return []

        if not self.session_cookie:
            self.logger.warning(
                "Kein Facebook Session-Cookie gesetzt. "
                "Bitte FACEBOOK_SESSION_COOKIE in .env setzen."
            )
            return []

        import asyncio

        try:
            return asyncio.run(self._suchen_async(suchbegriff, region))
        except RuntimeError:
            loop = asyncio.new_event_loop()
            result = loop.run_until_complete(self._suchen_async(suchbegriff, region))
            loop.close()
            return result

    async def _suchen_async(self, suchbegriff: str, region: str) -> list[Listing]:
        """Durchsucht Facebook-Gruppen asynchron."""
        await self._init_browser()

        if not self._page:
            return []

        alle_listings = []

        for gruppen_url in self.gruppen_urls:
            self.logger.info(f"Durchsuche Facebook-Gruppe: {gruppen_url}")
            listings = await self._gruppe_durchsuchen(
                gruppen_url, suchbegriff, region
            )
            alle_listings.extend(listings)

        return alle_listings

    async def _gruppe_durchsuchen(
        self, gruppen_url: str, suchbegriff: str, region: str
    ) -> list[Listing]:
        """Durchsucht eine einzelne Facebook-Gruppe."""
        listings = []

        try:
            # Gruppensuche öffnen
            such_url = f"{gruppen_url}search/?q={suchbegriff}"
            await self._page.goto(such_url, wait_until="networkidle", timeout=30000)

            # Warten auf Ergebnisse
            await self._page.wait_for_timeout(3000)

            # Posts sammeln
            posts = await self._page.query_selector_all(
                "[role='article'], .x1yztbdb, [data-ad-comet-preview='message']"
            )

            for post in posts[:10]:  # Max 10 Posts pro Gruppe
                listing = await self._parse_post(post, gruppen_url, region)
                if listing:
                    listings.append(listing)

        except Exception as e:
            self.logger.error(f"Fehler bei Gruppe {gruppen_url}: {e}")

        return listings

    async def _parse_post(
        self, post_element, gruppen_url: str, region: str
    ) -> Optional[Listing]:
        """Parst einen Facebook-Post zu einem Listing."""
        try:
            # Text extrahieren
            text_content = await post_element.inner_text()
            if not text_content or len(text_content) < 20:
                return None

            # Titel: Erste Zeile oder erste 100 Zeichen
            lines = text_content.strip().split("\n")
            titel = lines[0][:100] if lines else text_content[:100]

            # Link zum Post
            link_elem = await post_element.query_selector("a[href*='/posts/'], a[href*='/permalink/']")
            url = gruppen_url
            if link_elem:
                url = await link_elem.get_attribute("href") or gruppen_url
                if not url.startswith("http"):
                    url = f"https://www.facebook.com{url}"

            return Listing(
                url=url,
                titel=titel,
                beschreibung=text_content[:500],
                ort=region,
                quelle=Quelle.FACEBOOK,
                datum_gefunden=datetime.now(),
            )

        except Exception as e:
            self.logger.debug(f"Fehler beim Parsen eines Facebook-Posts: {e}")
            return None

    async def close(self):
        """Schließt den Browser."""
        if self._browser:
            await self._browser.close()
            self._browser = None
            self._page = None
