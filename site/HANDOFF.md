# SE Handwerk — Projekt-Handoff / Session-Stand

_Stand: 2026-07-15 · zum Weitermachen in einer neuen Session diese Datei einfügen._

## Live-Vorschau
- Interaktiver Link (self-contained, überlebt Sessions): **https://claude.ai/code/artifact/6718ef08-5583-42c2-9e35-5338bccf8b6c**

## Was das ist
Investoren-orientierte Website für **SE Handwerk** (Sanierung aus einer Hand, Bretzfeld/Raum Heilbronn).
Umsetzung des Claude-Design-Exports als echte App. Zielgruppe: Kapitalanleger, auswärtige Eigentümer, Erbengemeinschaften. Kernbotschaft: **Kontrolle über den Ablauf, Festpreis, ein Ansprechpartner.**

## Stack & Ort
- **Vite + React 19 + TypeScript**, react-router-dom. Reine Inline-Styles + `src/index.css`.
- Code liegt in **`site/`**. Git-Branch: **`feat/se-handwerk-site`** (lokaler Commit, **kein Remote** konfiguriert).

## Befehle (im Ordner `site/`)
```
npm install          # Abhängigkeiten
npm run dev          # Dev-Server
npm run build        # tsc + vite build  (→ dist/)
npm run preview      # gebauten Stand servieren (Port 4173)
npm run lint         # oxlint
npm run images       # kie.ai-Bilder generieren  (braucht .env.local + Netzzugang api.kie.ai)
```

## Architektur (wichtige Dateien)
- `src/pages/Home.tsx` — Reihenfolge der Sektionen
- `src/components/Hero.tsx` — **Blueprint-Hero + kinetische Variable-Font-Headline** (blur→scharf, dünn→schwarz, „Zum Festpreis." atmet in Gold), Maus-/Scroll-Parallax, Cursor-Goldlicht
- `src/components/Taktplan.tsx` — Signature-Set-Piece: scroll-gescrubbte Gantt-Sequenz Chaos→Takt (Farbe „verdient" sich in Gold)
- `src/components/RoterFaden.tsx` — goldene Spine-Linie, füllt sich über die Seite
- `src/components/sections.tsx` — Problem, Leistungen, Ablauf, Eigentümer, WarumSE, ErgebnisBand, Region, Kontakt
- `src/components/Reveal.tsx` — **Geometrie-basierte** Scroll-Reveals (NICHT IntersectionObserver, siehe Gotcha)
- `src/components/Figure.tsx` — echtes Bild sobald vorhanden, sonst Platzhalter
- `src/components/Nav.tsx` — inkl. Mobile-Menü
- `src/content.ts` — Texte (Leistungen, Ablauf, Zielgruppen, Vorteile)
- `src/fonts.css` + `public/fonts/*` — **selbst-gehostete Fonts** (GDPR-sicher, kein Google-CDN)
- `scripts/generate-images.mjs` — kie.ai-Generierung (`google/nano-banana`)

## Design-System
- Farben: Navy `#16222F`/`#1B2937`/`#101A26`, Ink `#EDF1F5`/`#B9C3CD`, **Gold `#C99A45`** (Akzent/CTA), Stahl `#3A4652`.
- Fonts: **Bricolage Grotesque** (Display, variabel), **IBM Plex Sans** (Body), **IBM Plex Mono** (Labels/Daten).

## Erledigt ✅
- Navy+Gold-Reskin, kinetischer Hero (ohne Eyebrow / ohne `§`-Nummern = KI-Tells entfernt).
- Taktplan, roter Faden, Reveals (41/41), Mobile-Menü, Favicon, OG/Meta.
- Startseite + Über-uns + Kontakt. Build & Lint sauber, keine Konsolenfehler.
- Copy geschärft: Festpreis prominent, ROI-Wort (vermietbar/verkaufsfertig), Taktplan als schriftliches Deliverable.
- kie.ai-Pipeline + 21st.dev-MCP eingerichtet.

## Offene Punkte (für die nächste Session) 🔜
1. **Echte Bilder** ziehen: `api.kie.ai` in die Egress-Allowlist der Umgebung, dann `npm run images`. Slots: `public/images/detail-uebergabe.jpg`, `public/images/interior-01.jpg`. (Alternativ Fotos vom Kunden.)
2. **21st.dev-MCP**: `21st.dev` allowlisten → in neuer Session als Tools verfügbar (aktuell „Needs authentication").
3. **Git-Remote** setzen und pushen (Repo z. B. `Susa-Sek/se-handwerk`) — sonst geht der Code beim Container-Neustart verloren.
4. Optional aus dem Business-Angel-Review: Festpreis-Garantie stärker, echte Referenzbilder, Foto-Protokoll für Remote-Eigentümer.

## Secrets (NICHT ins Git)
- `site/.env.local` → `KIE_AI_API_KEY=193845ff8d25402d42eb8bfb06eddc09` (gitignored). Bei Bedarf neu anlegen.
- 21st.dev-MCP-Key liegt in `~/.claude.json` (Header `x-api-key`). Tipp: Keys ggf. rotieren, da im Chat sichtbar.
- MCP neu registrieren: `claude mcp add --transport http 21st https://21st.dev/api/mcp --header "x-api-key: 21st_sk_…"`

## Gotchas (nicht erneut reinlaufen)
- **`overflow-x: clip` NICHT auf `<html>`** — macht IntersectionObserver kaputt (alle Reveals unsichtbar). Deshalb: Reveal ist geometrie-basiert; horizontaler Clip liegt auf `body`.
- Für den self-contained Artifact: **`<meta charset="utf-8">` an den Dateianfang**, sonst Mojibake bei Umlauten.
- Fonts nur mit **vollem Browser-User-Agent** von Google holen (sonst TTF statt woff2).

## Neustart-Rezept
1. Quellcode aus dem gesendeten Archiv `se-handwerk-source.tar.gz` entpacken (oder Repo mit Remote klonen).
2. `cd site && npm install`
3. `.env.local` mit dem KIE-Key anlegen (siehe oben).
4. `npm run dev` — weiterbauen. Diese Datei der neuen Session als Kontext geben.
