import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { SectionKicker, CtaBand } from '../components/sections';
import { useSeo, SEO_SITE } from '../hooks/useSeo';
import { alleWissensFragen, glossar } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };

const TITLE = 'Sanierungs-Wissen & Lexikon: Fragen und Begriffe erklärt | SE Handwerk';
const DESC =
  'Wissens-Hub rund um Sanierung und Renovierung: alle häufigen Fragen gebündelt und durchsuchbar, plus ein Lexikon der wichtigsten Begriffe – von Estrich bis Renovierungszarge. Raum Heilbronn.';

export default function Wissen() {
  const [q, setQ] = useState('');

  const fragen = useMemo(() => alleWissensFragen(), []);

  const needle = q.trim().toLowerCase();
  const match = (...felder: string[]) => !needle || felder.some((f) => f.toLowerCase().includes(needle));

  const fragenGefiltert = fragen.filter((f) => match(f.frage, f.antwort, f.gruppe));
  const glossarGefiltert = glossar.filter((g) => match(g.begriff, g.definition));

  // FAQ nach Gruppe bündeln (Reihenfolge stabil)
  const gruppen: { name: string; items: typeof fragenGefiltert }[] = [];
  for (const f of fragenGefiltert) {
    let g = gruppen.find((x) => x.name === f.gruppe);
    if (!g) { g = { name: f.gruppe, items: [] }; gruppen.push(g); }
    g.items.push(f);
  }

  useSeo({
    title: TITLE,
    description: DESC,
    path: '/wissen',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Sanierungs-Lexikon',
        url: SEO_SITE + '/wissen',
        hasDefinedTerm: glossar.map((g) => ({
          '@type': 'DefinedTerm',
          name: g.begriff,
          description: g.definition,
          ...(g.mehr ? { url: SEO_SITE + g.mehr.href } : {}),
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Sanierungs-Wissen & Lexikon',
        url: SEO_SITE + '/wissen',
        description: DESC,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Start', item: SEO_SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Wissen', item: SEO_SITE + '/wissen' },
        ],
      },
    ],
  });

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '146px 0 70px' }}>
        <div style={container}>
          <SectionKicker dark>Wissen &amp; Lexikon</SectionKicker>
          <Reveal as="h1" delay={40} style={{ fontSize: 'clamp(38px,5.4vw,80px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: '#F5F2EC', maxWidth: 900 }}>
            Sanierungs-Wissen, ehrlich erklärt
          </Reveal>
          <Reveal as="p" delay={110} style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(245,242,236,0.66)', maxWidth: 640, marginTop: 26 }}>
            Alle häufigen Fragen an einem Ort — plus ein Lexikon der Begriffe, über die auf jeder Baustelle geredet wird. Durchsuchbar, ohne Fachchinesisch. Raum Heilbronn.
          </Reveal>
          <Reveal delay={160} style={{ marginTop: 34, maxWidth: 520 }}>
            <label style={{ display: 'block' }}>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Wissen durchsuchen</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Suchen: z. B. Estrich, Kosten, Zarge …"
                style={{
                  width: '100%',
                  background: 'rgba(245,242,236,0.06)',
                  border: '1px solid rgba(245,242,236,0.22)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: '#F5F2EC',
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  fontSize: 15,
                  outlineColor: 'var(--gold)',
                }}
              />
            </label>
            <p style={{ fontFamily: mono, fontSize: 11.5, color: 'rgba(245,242,236,0.45)', marginTop: 10 }}>
              {fragenGefiltert.length} Fragen · {glossarGefiltert.length} Begriffe
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Häufige Fragen (gebündelt) ────────────────────────────────────── */}
      <section style={{ background: 'var(--paper)', padding: '80px 0' }}>
        <div style={{ ...container, maxWidth: 900 }}>
          <SectionKicker>Häufige Fragen</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 'clamp(26px,3.4vw,44px)', letterSpacing: '-0.025em', color: 'var(--t-ink)', margin: '6px 0 34px' }}>
            Fragen &amp; Antworten, gebündelt
          </Reveal>
          {gruppen.length === 0 ? (
            <p style={{ color: 'var(--t-sub)' }}>Keine Fragen gefunden. Andere Suche versuchen?</p>
          ) : (
            gruppen.map((g) => (
              <div key={g.name} style={{ marginBottom: 30 }}>
                <h3 style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 6 }}>{g.name}</h3>
                {g.items.map((f) => (
                  <details key={f.frage} style={{ borderTop: '1px solid var(--line-ink)', padding: '18px 0' }}>
                    <summary style={{ fontFamily: bricolage, fontWeight: 600, fontSize: 17.5, color: 'var(--t-ink)', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 18 }}>
                      {f.frage}
                      <span aria-hidden style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>+</span>
                    </summary>
                    <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--t-sub)', marginTop: 12, maxWidth: 760 }}>{f.antwort}</p>
                    <Link to={f.href} style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--gold-deep)', marginTop: 10, display: 'inline-block' }}>
                      → Mehr dazu
                    </Link>
                  </details>
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Sanierungs-Lexikon (A–Z) ──────────────────────────────────────── */}
      <section style={{ background: 'var(--paper2)', padding: '80px 0' }}>
        <div style={{ ...container, maxWidth: 900 }}>
          <SectionKicker>Sanierungs-Lexikon</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 'clamp(26px,3.4vw,44px)', letterSpacing: '-0.025em', color: 'var(--t-ink)', margin: '6px 0 34px' }}>
            Begriffe von A bis Z
          </Reveal>
          {glossarGefiltert.length === 0 ? (
            <p style={{ color: 'var(--t-sub)' }}>Kein Begriff gefunden.</p>
          ) : (
            <dl style={{ margin: 0 }}>
              {glossarGefiltert.map((g) => (
                <div key={g.begriff} style={{ borderTop: '1px solid var(--line-ink)', padding: '18px 0' }}>
                  <dt style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 18, color: 'var(--t-ink)', marginBottom: 6 }}>{g.begriff}</dt>
                  <dd style={{ margin: 0, fontSize: 15.5, lineHeight: 1.7, color: 'var(--t-sub)', maxWidth: 760 }}>
                    {g.definition}
                    {g.mehr && (
                      <>
                        {' '}
                        <Link to={g.mehr.href} style={{ fontFamily: mono, fontSize: 11.5, color: 'var(--gold-deep)', whiteSpace: 'nowrap' }}>
                          → {g.mehr.text}
                        </Link>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
