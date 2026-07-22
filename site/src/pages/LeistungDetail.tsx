import { Link, Navigate, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { SectionKicker, CtaBand } from '../components/sections';
import { useSectionLink } from '../hooks/useSectionLink';
import { useMagnetic } from '../hooks/useMagnetic';
import { useSeo, SEO_SITE } from '../hooks/useSeo';
import { ablauf, getLeistung, leistungen, regionen } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };

const ctaBase: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '16px 28px',
  borderRadius: 100,
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

export default function LeistungDetail() {
  const { slug } = useParams();
  const data = getLeistung(slug);
  const onSection = useSectionLink();
  const ctaPrimary = useMagnetic<HTMLAnchorElement>();

  const path = `/leistungen/${data?.slug ?? ''}`;
  const jsonLd = data
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: data.h1,
          serviceType: data.navTitle,
          description: data.metaDescription,
          url: SEO_SITE + path,
          areaServed: regionen.map((r) => ({ '@type': 'City', name: r })),
          provider: {
            '@type': 'LocalBusiness',
            name: 'SE Handwerk',
            url: SEO_SITE,
            areaServed: 'Raum Heilbronn',
            telephone: '+49 173 4536225',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Start', item: SEO_SITE + '/' },
            { '@type': 'ListItem', position: 2, name: 'Leistungen', item: SEO_SITE + '/#leistungen' },
            { '@type': 'ListItem', position: 3, name: data.navTitle, item: SEO_SITE + path },
          ],
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faq.map((f) => ({
            '@type': 'Question',
            name: f.frage,
            acceptedAnswer: { '@type': 'Answer', text: f.antwort },
          })),
        },
      ]
    : undefined;

  useSeo({
    title: data?.metaTitle ?? 'Leistungen | SE Handwerk',
    description: data?.metaDescription ?? '',
    path,
    jsonLd,
  });

  // unknown slug → back to the homepage services section
  if (!data) return <Navigate to="/#leistungen" replace />;

  const related = leistungen.filter((l) => l.slug !== data.slug);

  return (
    <main>
      {/* ── Hero (ink): breadcrumb + H1 + intro + CTAs ───────────────────── */}
      <section className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '146px 0 96px' }}>
        <div style={container}>
          <nav aria-label="Brotkrumen" style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(245,242,236,0.5)', marginBottom: 30 }}>
            <Link to="/" onClick={onSection('#top')} style={{ color: 'rgba(245,242,236,0.5)' }}>Start</Link>
            <span style={{ padding: '0 8px' }}>/</span>
            <Link to="/#leistungen" onClick={onSection('#leistungen')} style={{ color: 'rgba(245,242,236,0.5)' }}>Leistungen</Link>
            <span style={{ padding: '0 8px' }}>/</span>
            <span style={{ color: 'var(--gold)' }}>{data.navTitle}</span>
          </nav>

          <SectionKicker dark>{data.kicker}</SectionKicker>
          <Reveal as="h1" delay={40} style={{ fontSize: 'clamp(38px,5.4vw,80px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: '#F5F2EC', maxWidth: 900 }}>
            {data.h1}
          </Reveal>
          <Reveal as="p" delay={110} style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(245,242,236,0.66)', maxWidth: 680, marginTop: 26 }}>
            {data.intro}
          </Reveal>

          <Reveal delay={170} style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap' }}>
            <a ref={ctaPrimary} href="/#kontakt" onClick={onSection('#kontakt')} className="btn-primary magnetic" style={ctaBase}>
              Projekt besprechen
            </a>
            <a href="/#leistungen" onClick={onSection('#leistungen')} className="btn-ghost" style={ctaBase}>
              Alle Leistungen
            </a>
          </Reveal>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 40 }}>
            {regionen.map((r) => (
              <span key={r} style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.04em', color: 'rgba(245,242,236,0.7)', border: '1px solid rgba(245,242,236,0.18)', borderRadius: 100, padding: '7px 14px' }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leistungsumfang (paper) ──────────────────────────────────────── */}
      <section style={{ background: 'var(--paper)', padding: '104px 0' }}>
        <div style={container}>
          <SectionKicker>Leistungsumfang</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(30px,4vw,56px)', letterSpacing: '-0.025em', color: 'var(--t-ink)', maxWidth: 760 }}>
            Was wir bei {data.navTitle} übernehmen.
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 26, marginTop: 52 }}>
            {data.umfang.map((u, i) => (
              <Reveal key={u.titel} delay={60 + i * 50} style={{ borderTop: '1px solid var(--line-ink)', paddingTop: 22 }}>
                <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--gold-deep)', marginBottom: 14 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', color: 'var(--t-ink)', marginBottom: 10 }}>
                  {u.titel}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--t-sub)' }}>{u.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ablauf (ink) ─────────────────────────────────────────────────── */}
      <section className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '104px 0' }}>
        <div style={container}>
          <SectionKicker dark>Ablauf</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(30px,4vw,56px)', letterSpacing: '-0.025em', color: '#F5F2EC' }}>
            So läuft Ihr Projekt.
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 30, marginTop: 52 }}>
            {ablauf.map((step, i) => (
              <Reveal key={step.num} delay={60 + i * 60}>
                <div style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 46, lineHeight: 1, color: 'transparent', WebkitTextStroke: '1.2px rgba(224,168,60,0.6)', marginBottom: 18 }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 19, color: '#F5F2EC', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(245,242,236,0.62)' }}>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ (paper) ──────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--paper)', padding: '104px 0' }}>
        <div style={{ ...container, maxWidth: 860 }}>
          <SectionKicker>Häufige Fragen</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(28px,3.6vw,48px)', letterSpacing: '-0.025em', color: 'var(--t-ink)', marginBottom: 40 }}>
            {data.navTitle}: Fragen &amp; Antworten
          </Reveal>
          {data.faq.map((f, i) => (
            <Reveal key={f.frage} delay={40 + i * 40}>
              <details style={{ borderTop: '1px solid var(--line-ink)', padding: '20px 0' }}>
                <summary style={{ fontFamily: bricolage, fontWeight: 600, fontSize: 18, color: 'var(--t-ink)', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                  {f.frage}
                  <span aria-hidden style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>+</span>
                </summary>
                <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--t-sub)', marginTop: 14, maxWidth: 720 }}>{f.antwort}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── weitere Leistungen (internal links) ──────────────────────────── */}
      <section style={{ background: 'var(--paper2)', padding: '80px 0' }}>
        <div style={container}>
          <SectionKicker>Weitere Leistungen</SectionKicker>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 30 }}>
            {related.map((l) => (
              <Link
                key={l.slug}
                to={`/leistungen/${l.slug}`}
                className="grund-row"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '18px 4px', color: 'var(--t-ink)', borderTop: '1px solid var(--line-ink)' }}
              >
                <span style={{ fontFamily: bricolage, fontWeight: 600, fontSize: 17 }}>{l.title}</span>
                <span aria-hidden style={{ color: 'var(--gold-deep)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
