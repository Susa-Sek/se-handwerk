# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SE Handwerk is an autonomous lead acquisition agent for a German handcraft services company based in Heilbronn. It scrapes German marketplace platforms for service requests (flooring, furniture assembly, apartment handovers), scores them by relevance using 3 autonomous AI agents, and notifies via Telegram. A static HTML/CSS landing page is deployed separately on Vercel.

The codebase is entirely in German (variable names, config keys, comments, UI text). All new code should follow this convention.

## Repository Structure

```
SE-handwerk/
├── site/                 ← Live landing page (React/Vite SPA, deployed to Vercel)
│   ├── index.html, src/pages/, src/components/
│   ├── src/content.ts    ← Leistungen, Blog, Zielgruppen, Vorteile, Regionen
│   └── src/lib/analytics.ts  ← GA4 trackEvent
│
├── ads/                  ← Google-Ads-Testkampagne (YAML + Python, siehe ads/README.md)
│
├── website/              ← Superseded static predecessor (not deployed)
│   ├── index.html, *.html
│   ├── styles.css
│   ├── vercel.json
│   ├── assets/
│   └── blog/
│
├── agent/                ← Python agent (scraping + KI-Bewertung + Telegram)
│   ├── main.py           ← Orchestrator – steuert alle 3 KI-Agenten
│   ├── models.py, database.py, config.yaml
│   ├── requirements.txt
│   ├── ki/               ← 3 autonome KI-Agenten (OpenAI)
│   │   ├── client.py     ← Shared OpenAI-Client (retry, rate-limit, token-tracking)
│   │   ├── strategie_agent.py  ← Agent 1: Suchstrategie
│   │   ├── such_agent.py       ← Agent 2: GPT-Bewertung
│   │   └── outreach_agent.py   ← Agent 3: Personalisierte Nachrichten
│   ├── scrapers/
│   ├── filter/
│   ├── responses/
│   ├── notifications/
│   └── utils/
│
├── .env                  ← TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, OPENAI_API_KEY
├── .github/workflows/
├── CLAUDE.md
└── ERWEITERN.md
```

## Commands

```bash
# All agent commands run from the agent/ directory
cd agent

# Run agent continuously with scheduler (scrapes every 30 min per config)
python main.py

# Single scrape cycle (used in CI/CD)
python main.py --einmal

# Test Telegram connection
python main.py --test

# Use custom config file
python main.py --config custom_config.yaml

# Install dependencies
pip install -r requirements.txt
```

There is no test suite. Verification is done via `--test` (Telegram) and checking `agent/se_handwerk.log`.

## CI/CD

GitHub Actions workflow (`.github/workflows/akquise-agent.yml`) runs `cd agent && python main.py --einmal` every 2 hours on Ubuntu with Python 3.11. The SQLite database is persisted between runs via GitHub Artifacts (90-day retention). Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `OPENAI_API_KEY`.

## Architecture

```
agent/main.py (AkquiseAgent)  ─── orchestrates full cycle
  │
  ├── ki/                    ─── 3 autonomous AI agents (OpenAI GPT)
  │   ├── client.py          ─── shared OpenAI client: retry, rate-limit, token-tracking, cost control
  │   ├── strategie_agent.py ─── Agent 1: analyzes success rates, suggests new search terms/platforms (1x daily)
  │   ├── such_agent.py      ─── Agent 2: GPT-based lead scoring (replaces/supplements rule-based scorer)
  │   └── outreach_agent.py  ─── Agent 3: personalized response messages per lead
  │
  ├── scrapers/              ─── all extend BaseScraper (retry, rate-limit, user-agent rotation)
  │   ├── base.py            ─── abstract base: _request(), alle_suchen() with dedup
  │   ├── kleinanzeigen.py     (active)
  │   ├── google_search.py     (active, site-filtered)
  │   ├── myhammer.py          (disabled - 403)
  │   ├── facebook.py          (placeholder)
  │   ├── nebenan.py           (implemented, disabled)
  │   └── markt.py             (implemented, disabled)
  │
  ├── filter/
  │   ├── criteria.py        ─── exclusion rules + auto-categorization (Boden/Montage/Übergabe/Sonstiges)
  │   └── scorer.py          ─── weighted score 0-100: Region 30% + Leistung 40% + Qualität 30%
  │
  ├── responses/
  │   └── generator.py       ─── template-based response suggestions (fallback for KI)
  │
  ├── notifications/
  │   └── telegram_bot.py    ─── async Telegram: lead alerts, daily summary, error reports
  │
  ├── database.py            ─── SQLite manager: dedup (MD5 url_hash), status tracking, cleanup
  ├── models.py              ─── dataclasses (Listing, Bewertungsergebnis, StrategiePlan) + enums
  └── config.yaml            ─── all parameters: search terms, regions, scoring weights, scraper toggles, ki settings
```

**Key data flow:**
1. StrategieAgent (1x daily) → analyzes past results → suggests optimized search terms via Telegram
2. Scrapers return `Listing` objects → `database.py` deduplicates by URL hash
3. SuchAgent (GPT) scores listings → fallback to rule-based `scorer.py` on API error
4. OutreachAgent (GPT) creates personalized messages → fallback to template `generator.py`
5. `telegram_bot.py` sends notification if priority is Green (≥70) or Yellow (≥40)

## KI-Agenten

Three autonomous AI agents powered by OpenAI GPT:

- **StrategieAgent**: Runs 1x daily. Analyzes success rates, suggests new search terms and platforms. Sends suggestions via Telegram (not auto-applied).
- **SuchAgent**: Runs every cycle. GPT-based scoring of listings in batches of 5. Falls back to rule-based scorer on API error.
- **OutreachAgent**: Runs for each relevant lead (Score ≥ 40). Generates personalized response messages adapted to platform style.

All share `KIClient` (client.py) which handles retry, rate-limiting, token tracking and daily cost limits.

Configuration in `config.yaml` under `ki:` section. Set `ki.enabled: false` to disable all KI features and use only rule-based scoring.

## Adding a New Scraper

Documented in `ERWEITERN.md`. Four steps:
1. Add value to `Quelle` enum in `agent/models.py`
2. Create scraper class in `agent/scrapers/` extending `BaseScraper` with `name` property and `suchen(suchbegriff, region)` method
3. Add config section in `agent/config.yaml` with `enabled: true`
4. Import and register in `agent/main.py` `_init_scrapers()`

`BaseScraper` provides `_request(url)` with retry/rate-limit and `alle_suchen()` which iterates search terms x regions.

## Configuration

- `agent/config.yaml`: search terms, regions, scoring weights, scraper on/off, exclusion lists, KI settings
- `.env` (project root): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `OPENAI_API_KEY` (loaded via python-dotenv)
- Scoring thresholds: Green >= 70, Yellow >= 40, Red < 40
- KI cost limit: configurable daily maximum in EUR (`ki.kosten_limit_tag_euro`)

## Landing Page

The live site at sehandwerk.de is the React/Vite SPA in `site/` (`react-router-dom`, routes in `src/App.tsx`: `/`, `/leistungen/:slug`, `/blog`, `/blog/:slug`, `/ueber-uns`, `/kontakt`, `/impressum`, `/datenschutz`). Deployed to Vercel; the Vercel Root Directory must be set to `site/`. Copy and blog content live in `site/src/content.ts`. Lead capture is a client-side form (`src/components/ContactForm.tsx`) posting to FormSubmit.co.

GA4 tracking is wired via `site/index.html` (gtag.js, measurement ID `G-8FEM0QHGZ1`) and `site/src/lib/analytics.ts` (`trackEvent`). It fires `generate_lead` on form submit and on phone/WhatsApp clicks, and `page_view` on every route change — `send_page_view` is disabled in the gtag config because the SPA handles it manually. These are independent of the Python agent.

The `website/` directory (static HTML/CSS predecessor) is not deployed; `site/vercel.json` 301-redirects its old URLs. Treat it as historical reference, not a target for new work.

## Google Ads (`ads/`)

`ads/kampagne.yaml` holds the search campaign as editable data (keywords, ad copy, negative keywords, geo radius, ad schedule, bids). `ads/kampagne_erstellen.py` applies it in one atomic `GoogleAdsService.Mutate` request; campaigns are always created `PAUSED`. Three stages: `--check` (offline format validation), no flag (server-side `validate_only`, creates nothing), `--live` (creates). `ads/konto_pruefen.py` shows which accounts the credentials reach. Credentials come from `ads/.env` (gitignored) — see `ads/README.md`.
