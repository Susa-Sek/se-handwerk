import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ablauf, leistungen, leistungenDetail, regionen } from './src/content.js'

const SITE = 'https://www.sehandwerk.de'
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Build-time prerendering of the service pages: for maximum SEO strength each
// /leistungen/<slug> route gets a real static HTML file with its own title,
// meta, canonical/OG, JSON-LD and semantic body content (H1, Leistungsumfang,
// Ablauf, FAQ, internal links). Runs in pure Node during `vite build`, so it
// works in the Vercel git build (no headless browser needed). React uses
// createRoot(), so on load it replaces the prerendered markup with the SPA.
function prerenderLeistungen(): Plugin {
  return {
    name: 'prerender-leistungen',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      let shell: string
      try {
        shell = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      } catch {
        return
      }

      for (const l of leistungenDetail) {
        const path = `/leistungen/${l.slug}`
        const url = SITE + path
        const jsonLd = [
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: l.h1,
            serviceType: l.navTitle,
            description: l.metaDescription,
            url,
            areaServed: regionen.map((r) => ({ '@type': 'City', name: r })),
            provider: { '@type': 'LocalBusiness', name: 'SE Handwerk', url: SITE, areaServed: 'Raum Heilbronn', telephone: '+49 173 4536225' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Start', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'Leistungen', item: SITE + '/#leistungen' },
              { '@type': 'ListItem', position: 3, name: l.navTitle, item: url },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: l.faq.map((f) => ({ '@type': 'Question', name: f.frage, acceptedAnswer: { '@type': 'Answer', text: f.antwort } })),
          },
        ]

        const related = leistungen
          .filter((x) => x.slug !== l.slug)
          .map((x) => `<li><a href="/leistungen/${x.slug}">${esc(x.title)}</a></li>`)
          .join('')

        const body = `<main style="background:#0D0E10;color:#F5F2EC;min-height:100vh;font-family:'IBM Plex Sans',system-ui,sans-serif;padding:120px 24px 60px;max-width:1240px;margin:0 auto">
<nav aria-label="Brotkrumen"><a href="/">Start</a> / <a href="/#leistungen">Leistungen</a> / <span>${esc(l.navTitle)}</span></nav>
<p>${esc(l.kicker)}</p>
<h1>${esc(l.h1)}</h1>
<p>${esc(l.intro)}</p>
<p><a href="/#kontakt">Projekt besprechen</a> · <a href="/#leistungen">Alle Leistungen</a></p>
<p>Einsatzgebiet: ${regionen.map(esc).join(', ')}</p>
<section><h2>Was wir bei ${esc(l.navTitle)} übernehmen.</h2><ul>${l.umfang.map((u) => `<li><h3>${esc(u.titel)}</h3><p>${esc(u.text)}</p></li>`).join('')}</ul></section>
<section><h2>So läuft Ihr Projekt.</h2><ol>${ablauf.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></li>`).join('')}</ol></section>
<section><h2>${esc(l.navTitle)}: Fragen &amp; Antworten</h2><dl>${l.faq.map((f) => `<dt>${esc(f.frage)}</dt><dd>${esc(f.antwort)}</dd>`).join('')}</dl></section>
<section><h2>Weitere Leistungen</h2><ul>${related}</ul></section>
</main>`

        const head = `<title>${esc(l.metaTitle)}</title>
<meta name="description" content="${esc(l.metaDescription)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(l.metaTitle)}" />
<meta property="og:description" content="${esc(l.metaDescription)}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`

        const html = shell
          .replace(/<title>[\s\S]*?<\/title>/, '')
          .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
          .replace(/<link\s+rel="canonical"[^>]*>/, '')
          .replace(/<meta\s+property="og:url"[^>]*>/, '')
          .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, '')
          .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, '')
          .replace('</head>', head + '\n</head>')
          .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

        const dir = resolve(outDir, 'leistungen', l.slug)
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, 'index.html'), html)
      }
      // eslint-disable-next-line no-console
      console.log(`prerender: ${leistungenDetail.length} Leistungsseiten als statisches HTML erzeugt`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderLeistungen()],
})
