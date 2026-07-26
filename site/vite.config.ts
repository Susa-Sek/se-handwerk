import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ablauf, blogPosts, leistungen, leistungenDetail, regionen, seitenSeo } from './src/content.js'

const SITE = 'https://www.sehandwerk.de'
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Insert a static page into a copy of the built index.html shell: replaces the
// head SEO tags (unless keepHead), injects JSON-LD, and fills #root with
// prerendered semantic content. React (createRoot) replaces #root on load.
function render(
  shell: string,
  opts: { title: string; description: string; url: string; body: string; jsonLd?: unknown; keepHead?: boolean; image?: string },
) {
  const headExtra: string[] = []
  if (!opts.keepHead) {
    headExtra.push(
      `<title>${esc(opts.title)}</title>`,
      `<meta name="description" content="${esc(opts.description)}" />`,
      `<link rel="canonical" href="${opts.url}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${opts.url}" />`,
      `<meta property="og:title" content="${esc(opts.title)}" />`,
      `<meta property="og:description" content="${esc(opts.description)}" />`,
    )
    if (opts.image) headExtra.push(`<meta property="og:image" content="${opts.image}" />`, `<meta name="twitter:image" content="${opts.image}" />`)
  }
  if (opts.jsonLd) headExtra.push(`<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>`)

  let html = shell
  if (!opts.keepHead) {
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
      .replace(/<link\s+rel="canonical"[^>]*>/, '')
      .replace(/<meta\s+property="og:url"[^>]*>/, '')
      .replace(/<meta\s+property="og:title"[\s\S]*?\/>/, '')
      .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, '')
    // give the page its own OG image (strip the default so it does not win)
    if (opts.image) {
      html = html
        .replace(/<meta\s+property="og:image"[^>]*>/, '')
        .replace(/<meta\s+name="twitter:image"[^>]*>/, '')
    }
  }
  return html
    .replace('</head>', headExtra.join('\n') + '\n</head>')
    .replace('<div id="root"></div>', `<div id="root">${opts.body}</div>`)
}

const MAIN_OPEN =
  `<main style="background:#0D0E10;color:#F5F2EC;min-height:100vh;font-family:'IBM Plex Sans',system-ui,sans-serif;padding:120px 24px 60px;max-width:1240px;margin:0 auto">`

// Build-time prerendering for maximum SEO: every route is written as a real
// static HTML file with its own title/meta/canonical/OG, JSON-LD and semantic
// body content. Pure Node — runs in the Vercel git build, no headless browser.
function prerenderSeo(): Plugin {
  return {
    name: 'prerender-seo',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      let shell: string
      try {
        shell = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      } catch {
        return
      }
      const write = (routePath: string, html: string) => {
        const dir = routePath === '/' ? outDir : resolve(outDir, routePath.replace(/^\//, ''))
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, 'index.html'), html)
      }

      // ── Home: keep the strong existing head meta, add body + brand JSON-LD ──
      const home = seitenSeo.home
      const homeJsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'SE Handwerk',
          url: SITE,
          areaServed: regionen.map((r) => ({ '@type': 'City', name: r })),
          telephone: '+49 173 4536225',
          description: home.description,
        },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SE Handwerk', url: SITE },
      ]
      const homeBody = `${MAIN_OPEN}
<h1>${esc(home.h1!)}</h1>
<p>${esc(home.intro!)}</p>
<section><h2>Unsere Leistungen</h2><ul>${leistungen.map((l) => `<li><a href="/leistungen/${l.slug}">${esc(l.title)}</a> — ${esc(l.desc)}</li>`).join('')}</ul></section>
<p>Einsatzgebiet: ${regionen.map(esc).join(', ')}</p>
<p><a href="/#kontakt">Projekt besprechen</a> · <a href="/ueber-uns">Über uns</a> · <a href="/kontakt">Kontakt</a></p>
</main>`
      write('/', render(shell, { title: home.title, description: home.description, url: SITE + '/', body: homeBody, jsonLd: homeJsonLd, keepHead: true }))

      // ── Standard pages ────────────────────────────────────────────────────
      for (const key of ['ueber-uns', 'kontakt', 'impressum', 'datenschutz'] as const) {
        const s = seitenSeo[key]
        const url = SITE + s.path
        const body = `${MAIN_OPEN}
<nav aria-label="Brotkrumen"><a href="/">Start</a> / <span>${esc(s.h1 ?? s.title)}</span></nav>
<h1>${esc(s.h1 ?? s.title)}</h1>
${s.intro ? `<p>${esc(s.intro)}</p>` : ''}
<p><a href="/#leistungen">Leistungen</a> · <a href="/#kontakt">Kontakt aufnehmen</a></p>
</main>`
        write(s.path, render(shell, { title: s.title, description: s.description, url, body }))
      }

      // ── Leistungs-Unterseiten (voller Inhalt) ─────────────────────────────
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
        const body = `${MAIN_OPEN}
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
        write(path, render(shell, { title: l.metaTitle, description: l.metaDescription, url, body, jsonLd }))
      }

      // ── Blog-Liste ────────────────────────────────────────────────────────
      const blogBody = `${MAIN_OPEN}
<h1>Ratgeber rund um Sanierung &amp; Renovierung</h1>
<p>Ehrliche Praxis-Tipps zu Kosten, Abläufen und Materialien aus dem Raum Heilbronn.</p>
<ul>${blogPosts.map((p) => `<li><a href="/blog/${p.slug}"><img src="/images/${p.bild}" alt="${esc(p.bildAlt)}" width="480" height="300" loading="lazy" /><br />${esc(p.title)}</a> — ${esc(p.excerpt)}</li>`).join('')}</ul>
</main>`
      write('/blog', render(shell, {
        title: 'Ratgeber & Blog – Sanierung, Boden & Renovierung | SE Handwerk',
        description: 'Praxis-Ratgeber rund um Sanierung, Bodenarbeiten und Renovierung im Raum Heilbronn: Kosten, Reihenfolge, Materialvergleiche und ehrliche Tipps vom Handwerksbetrieb.',
        url: SITE + '/blog',
        body: blogBody,
        jsonLd: { '@context': 'https://schema.org', '@type': 'Blog', name: 'SE Handwerk Ratgeber', url: SITE + '/blog', blogPost: blogPosts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.datum })) },
      }))

      // ── Blog-Artikel ──────────────────────────────────────────────────────
      for (const p of blogPosts) {
        const path = `/blog/${p.slug}`
        const url = SITE + path
        const jsonLd = [
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.metaDescription,
            datePublished: p.datum,
            dateModified: p.datum,
            url,
            author: { '@type': 'Organization', name: 'SE Handwerk' },
            publisher: { '@type': 'Organization', name: 'SE Handwerk', url: SITE },
            mainEntityOfPage: url,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Start', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'Ratgeber', item: SITE + '/blog' },
              { '@type': 'ListItem', position: 3, name: p.title, item: url },
            ],
          },
        ]
        const body = `${MAIN_OPEN}
<nav aria-label="Brotkrumen"><a href="/">Start</a> / <a href="/blog">Ratgeber</a> / <span>${esc(p.title)}</span></nav>
<p>${esc(p.kategorie)} · ${esc(p.lesezeit)}</p>
<h1>${esc(p.title)}</h1>
<figure><img src="/images/${p.bild}" alt="${esc(p.bildAlt)}" width="1200" height="675" /><figcaption>Symbolbild</figcaption></figure>
<p>${esc(p.excerpt)}</p>
<section><h2>Das Wichtigste in Kürze</h2><ul>${p.kurz.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></section>
${p.sections.map((sec) => `<section><h2>${esc(sec.h2)}</h2>${sec.paras.map((x) => `<p>${esc(x)}</p>`).join('')}${sec.list ? `<ul>${sec.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}${sec.bild ? `<figure><img src="/images/${sec.bild}" alt="${esc(sec.bildAlt ?? '')}" width="1200" height="675" loading="lazy" /><figcaption>Symbolbild</figcaption></figure>` : ''}</section>`).join('')}
${p.relatedLeistung ? `<p><a href="/leistungen/${p.relatedLeistung}">Passende Leistung ansehen</a></p>` : ''}
<p><a href="/blog">Alle Beiträge</a> · <a href="/#kontakt">Projekt besprechen</a></p>
</main>`
        write(path, render(shell, { title: p.metaTitle, description: p.metaDescription, url, body, jsonLd, image: SITE + '/images/' + p.bild }))
      }

      // eslint-disable-next-line no-console
      console.log(`prerender: ${leistungenDetail.length + 5 + 1 + blogPosts.length} Seiten als statisches HTML erzeugt`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderSeo()],
})
