import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { SectionKicker, CtaBand } from '../components/sections';
import { useSeo, SEO_SITE } from '../hooks/useSeo';
import { blogPosts } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };

export default function BlogList() {
  useSeo({
    title: 'Ratgeber & Blog – Sanierung, Boden & Renovierung | SE Handwerk',
    description:
      'Praxis-Ratgeber rund um Sanierung, Bodenarbeiten und Renovierung im Raum Heilbronn: Kosten, Reihenfolge, Materialvergleiche und ehrliche Tipps vom Handwerksbetrieb.',
    path: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'SE Handwerk Ratgeber',
      url: SEO_SITE + '/blog',
      blogPost: blogPosts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SEO_SITE}/blog/${p.slug}`, datePublished: p.datum })),
    },
  });

  return (
    <main>
      <section className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '146px 0 90px' }}>
        <div style={container}>
          <SectionKicker dark>Ratgeber</SectionKicker>
          <Reveal as="h1" delay={40} style={{ fontSize: 'clamp(38px,5.4vw,80px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: '#F5F2EC', maxWidth: 900 }}>
            Ratgeber rund um Sanierung &amp; Renovierung
          </Reveal>
          <Reveal as="p" delay={110} style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(245,242,236,0.66)', maxWidth: 640, marginTop: 26 }}>
            Ehrliche Praxis-Tipps zu Kosten, Abläufen und Materialien — aus dem Alltag eines Handwerksbetriebs im Raum Heilbronn.
          </Reveal>
        </div>
      </section>

      <section style={{ background: 'var(--paper)', padding: '90px 0 100px' }}>
        <div style={container}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 26 }}>
            {blogPosts.map((p, i) => (
              <Reveal key={p.slug} delay={40 + i * 60}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="tile tile-white"
                  style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 14, padding: 0, overflow: 'hidden', color: 'var(--t-ink)' }}
                >
                  <img
                    src={`/images/${p.bild}`}
                    alt={p.bildAlt}
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px 28px 28px' }}>
                    <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: 'var(--gold-deep)' }}>
                      {p.kategorie} · {p.lesezeit}
                    </span>
                    <h2 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 22, letterSpacing: '-0.015em', margin: '12px 0 12px', color: 'var(--t-ink)' }}>
                      {p.title}
                    </h2>
                    <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--t-sub)' }}>{p.excerpt}</p>
                    <span style={{ marginTop: 'auto', paddingTop: 22, fontFamily: mono, fontSize: 11, color: 'var(--gold-deep)', letterSpacing: '0.04em' }}>
                      Weiterlesen →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
