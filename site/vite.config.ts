import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ablauf, blogPosts, leistungen, leistungenDetail, regionen, seitenSeo, vorteile, zielgruppen } from './src/content.js'

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

const MAIN_OPEN = `<main role="main">`

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
      const homeFaq = leistungenDetail[0].faq
      const featuredPosts = ['sanierung-raum-heilbronn', 'generalunternehmer-sanierung', 'wohnung-sanieren-vor-vermietung', 'wohnungsuebergabe-checkliste']
        .map((s) => blogPosts.find((p) => p.slug === s))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
      const homeJsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'GeneralContractor',
          '@id': `${SITE}/#business`,
          name: 'SE Handwerk',
          url: SITE,
          image: `${SITE}/images/nachher.jpg`,
          logo: `${SITE}/images/logo-dark.png`,
          email: 'kontakt@sehandwerk.de',
          telephone: '+49 173 4536225',
          priceRange: '€€',
          areaServed: regionen.map((r) => ({ '@type': 'City', name: r })),
          knowsAbout: ['Komplettsanierung', 'Bodenarbeiten', 'Malerarbeiten', 'Badsanierung', 'Trockenbau', 'Wohnungsübergabe'],
          description: home.description,
        },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SE Handwerk', url: SITE, publisher: { '@id': `${SITE}/#business` }, author: { '@id': `${SITE}/#business` } },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: homeFaq.map((f) => ({
            '@type': 'Question',
            name: f.frage,
            acceptedAnswer: { '@type': 'Answer', text: f.antwort },
          })),
        },
      ]
      // internal link with descriptive title attribute
      const il = (href: string, text: string, title: string) => `<a href="${href}" title="${esc(title)}">${esc(text)}</a>`
      const ablaufProsa = ablauf
        .map((a) => `<li><strong>${esc(a.title)}.</strong> ${esc(a.desc)}</li>`)
        .join('')
      const ratgeberLinks = featuredPosts
        .map((p) => il(`/blog/${p.slug}`, p.title, p.metaTitle))
        .join(', ')
      const homeBody = `${MAIN_OPEN}
<header role="banner">
<h1>${esc(home.h1!)}</h1>
<p>${esc(home.intro!)}</p>
</header>
<nav role="navigation" aria-label="Wichtige Seiten">
${il('/leistungen/komplettsanierung', 'Komplettsanierung', 'Komplettsanierung im Raum Heilbronn')} ·
${il('/leistungen/bodenarbeiten', 'Böden', 'Böden verlegen im Raum Heilbronn')} ·
${il('/leistungen/wand-decke', 'Wände & Decken', 'Maler- und Trockenbauarbeiten')} ·
${il('/leistungen/bad-sanitaer', 'Bad & Sanitär', 'Badsanierung im Raum Heilbronn')} ·
${il('/leistungen/einzelgewerke', 'Einzelgewerke', 'Einzelne Gewerke beauftragen')} ·
${il('/blog', 'Ratgeber', 'Ratgeber rund um Sanierung')} ·
${il('/ueber-uns', 'Über uns', 'Über SE Handwerk')} ·
${il('/kontakt', 'Kontakt', 'Kontakt aufnehmen')}
</nav>
<img src="/images/nachher.jpg" alt="Frisch sanierter, heller Wohnraum nach der Übergabe im Raum Heilbronn" width="1200" height="800" />
<article>
<p>Die meisten, die bei uns anrufen, haben ein konkretes Problem und wenig Zeit. Eine geerbte Wohnung, zweihundert Kilometer entfernt. Ein Mieter ist raus, der nächste will zum Ersten rein, dazwischen liegt ein Wochenende. Ein Bad, das seit den Neunzigern niemand mehr angefasst hat. Wir sind die, die das dann zusammenhalten — damit Sie nicht fünf Handwerkern hinterhertelefonieren.</p>
<h2>Was wir machen</h2>
<p>Wir sanieren Wohnungen, Häuser und Gewerbeeinheiten im Raum Heilbronn — vom einzelnen Gewerk bis zur ${il('/leistungen/komplettsanierung', 'kompletten Sanierung', 'Komplettsanierung im Raum Heilbronn')}. Wir verlegen ${il('/leistungen/bodenarbeiten', 'Böden', 'Böden verlegen: Vinyl, Laminat, Parkett, Fliesen')} — Vinyl, Laminat, Parkett, Fliesen —, verputzen und streichen ${il('/leistungen/wand-decke', 'Wände und Decken', 'Maler- und Trockenbauarbeiten')}, machen ${il('/leistungen/bad-sanitaer', 'Bäder', 'Badsanierung im Raum Heilbronn')} neu und übernehmen ${il('/leistungen/einzelgewerke', 'einzelne Gewerke', 'Einzelne Gewerke beauftragen')}, wenn nur ein Teil dran ist. Einer koordiniert Termine, Reihenfolge und Übergabe. Den Preis nennen wir <em>vor</em> Baubeginn: verbindlich und aufgeschlüsselt, damit Sie sehen, was drinsteht.</p>
<figure><img src="/images/leistung-boden.jpg" alt="Frisch verlegter Vinylboden in einem hellen, leeren Raum" width="800" height="600" /><figcaption>Böden verlegen wir inklusive Untergrundvorbereitung, Trittschall und Sockelleisten.</figcaption></figure>
<h2>Für wen das gedacht ist</h2>
<p>Ein großer Teil unserer Arbeit sind Wohnungen für Vermieter und Kapitalanleger: gekauft, und jetzt soll sie schnell wieder vermietbar sein. Wir richten sie her, während Sie woanders sind, und halten Sie mit Fotos auf dem Laufenden. Genauso oft melden sich Erben, die eine Immobilie am anderen Ende der Republik haben und nicht wissen, wo sie anfangen sollen. Und private Bauherren, die ihr Zuhause sanieren und keine Lust haben, sich nebenbei zum Bauleiter fortzubilden. Verständlich.</p>
<figure><img src="/images/leistung-bad.jpg" alt="Frisch saniertes Bad mit großformatigen Fliesen und bodengleicher Dusche" width="800" height="600" /><figcaption>Bäder machen wir komplett neu — von den Fliesen bis zur bodengleichen Dusche.</figcaption></figure>
<h2>Wie ein Auftrag abläuft</h2>
<ol>${ablaufProsa}</ol>
<blockquote>Wir versprechen kein festes Datum, das am Ende keiner halten kann. Wir versprechen, dass Sie als Erste erfahren, wenn sich etwas verschiebt.<cite>SE Handwerk</cite></blockquote>
<h2>Häufige Fragen</h2>
${homeFaq.map((f) => `<h3>${esc(f.frage)}</h3><p>${esc(f.antwort)}</p>`).join('')}
</article>
<aside aria-label="Einsatzgebiet und Ratgeber">
<h2>Wo wir arbeiten</h2>
<p>Wir sind im Raum Heilbronn unterwegs — in ${regionen.map(esc).join(', ')} und im Umland dazwischen. Erzählen Sie uns kurz von Ihrem Objekt: ${il('/kontakt', 'Kontakt aufnehmen', 'Kontakt zu SE Handwerk')} oder mehr ${il('/ueber-uns', 'über uns', 'Über SE Handwerk')} lesen.</p>
<h3>Ratgeber</h3>
<p>Was kostet was, wie lange dauert es, worauf sollten Sie achten? Das schreiben wir ehrlich auf: ${ratgeberLinks} — oder ${il('/blog', 'alle Artikel ansehen', 'Alle Ratgeber-Artikel')}.</p>
</aside>
<footer role="contentinfo">
<p>SE Handwerk — Sanierung und Renovierung im Raum Heilbronn. Inhaltlich verantwortet vom Team von SE Handwerk. ${il('/kontakt', 'Kontakt', 'Kontakt aufnehmen')} · ${il('/impressum', 'Impressum', 'Impressum')} · Regionale Handwerksinfos: <a href="https://www.hwk-heilbronn.de/" title="Handwerkskammer Heilbronn-Franken" rel="noopener nofollow">Handwerkskammer Heilbronn-Franken</a>.</p>
</footer>
</main>`
      write('/', render(shell, { title: home.title, description: home.description, url: SITE + '/', body: homeBody, jsonLd: homeJsonLd, keepHead: true }))

      // ── Standard pages ────────────────────────────────────────────────────
      const leistungenLinks = `<section><h2>Unsere Leistungen</h2><ul>${leistungen.map((l) => `<li>${il(`/leistungen/${l.slug}`, l.title, l.title)} — ${esc(l.desc)}</li>`).join('')}</ul></section>`
      const ablaufBlock = `<section><h2>So läuft Ihre Sanierung ab</h2><ol>${ablauf.map((a) => `<li><strong>${esc(a.title)}.</strong> ${esc(a.desc)}</li>`).join('')}</ol></section>`
      const standardExtra: Record<string, string> = {
        'ueber-uns':
          `<img src="/images/nachher.jpg" alt="Frisch saniertes, bezugsfertiges Zimmer im Raum Heilbronn" width="1200" height="800" />`
          + `<article>`
          + `<p>SE Handwerk saniert und renoviert im Raum Heilbronn — vom einzelnen Gewerk bis zur kompletten Wohnung. Der Kern ist simpel: Sie haben <em>einen</em> Ansprechpartner statt fünf, von der ersten Begehung bis zur bezugsfertigen Übergabe. Wir koordinieren die Gewerke, halten den Ablauf zusammen und nennen den Preis vor Baubeginn.</p>`
          + `<h2>Wofür wir stehen</h2><p>${vorteile.map((v) => `${esc(v.desc)}`).join(' ')}</p>`
          + `<h2>Für wen wir arbeiten</h2><p>${zielgruppen.map((z) => `${esc(z.desc)}`).join(' ')}</p>`
          + ablaufBlock
          + `</article>`
          + leistungenLinks,
        kontakt:
          `<img src="/images/leistung-komplett.jpg" alt="Heller, frisch sanierter Wohnraum im Raum Heilbronn" width="1200" height="800" />`
          + `<article>`
          + `<p>Sie erreichen uns telefonisch oder per E-Mail an kontakt@sehandwerk.de. Schildern Sie uns kurz Ihr Vorhaben — je konkreter, desto genauer die erste Einschätzung. Wir melden uns meist noch am selben Tag zurück.</p>`
          + ablaufBlock
          + `<h2>Häufige Fragen</h2>${leistungenDetail[0].faq.map((f) => `<h3>${esc(f.frage)}</h3><p>${esc(f.antwort)}</p>`).join('')}`
          + `<p>Einsatzgebiet: ${regionen.map(esc).join(', ')} und Umgebung.</p>`
          + `</article>`
          + leistungenLinks,
      }
      for (const key of ['ueber-uns', 'kontakt', 'impressum', 'datenschutz'] as const) {
        const s = seitenSeo[key]
        const url = SITE + s.path
        const body = `${MAIN_OPEN}
<nav role="navigation" aria-label="Brotkrumen">${il('/', 'Start', 'Zur Startseite')} / <span>${esc(s.h1 ?? s.title)}</span></nav>
<header role="banner"><h1>${esc(s.h1 ?? s.title)}</h1>
${s.intro ? `<p>${esc(s.intro)}</p>` : ''}</header>
${standardExtra[key] ?? ''}
<footer role="contentinfo"><p>${il('/#leistungen', 'Leistungen', 'Unsere Leistungen')} · ${il('/#kontakt', 'Kontakt aufnehmen', 'Kontakt zu SE Handwerk')} · ${il('/', 'Startseite', 'Zur Startseite')}</p></footer>
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
            provider: { '@type': 'GeneralContractor', '@id': `${SITE}/#business`, name: 'SE Handwerk', url: SITE, areaServed: 'Raum Heilbronn', telephone: '+49 173 4536225' },
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
<p><small>Hinweis: Dieser Ratgeber bietet allgemeine, unverbindliche Informationen nach bestem Wissen (Stand 2026). Preisangaben sind grobe Richtwerte und kein Angebot; sie können je nach Objekt, Zustand, Region und Ausführung erheblich abweichen. Der Beitrag ersetzt keine individuelle Fach-, Steuer- oder Rechtsberatung.</small></p>
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
