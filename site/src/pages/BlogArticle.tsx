import { Link, Navigate, useParams } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { CtaBand } from '../components/sections';
import { useSeo, SEO_SITE } from '../hooks/useSeo';
import { getLeistung, getPost } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";
const container: React.CSSProperties = { maxWidth: 820, margin: '0 auto', padding: '0 40px' };

export default function BlogArticle() {
  const { slug } = useParams();
  const post = getPost(slug);
  const path = `/blog/${post?.slug ?? ''}`;

  useSeo({
    title: post?.metaTitle ?? 'Ratgeber | SE Handwerk',
    description: post?.metaDescription ?? '',
    path,
    jsonLd: post
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.datum,
            dateModified: post.datum,
            url: SEO_SITE + path,
            author: { '@type': 'Organization', name: 'SE Handwerk' },
            publisher: { '@type': 'Organization', name: 'SE Handwerk', url: SEO_SITE },
            mainEntityOfPage: SEO_SITE + path,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Start', item: SEO_SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'Ratgeber', item: SEO_SITE + '/blog' },
              { '@type': 'ListItem', position: 3, name: post.title, item: SEO_SITE + path },
            ],
          },
        ]
      : undefined,
  });

  if (!post) return <Navigate to="/blog" replace />;

  const related = post.relatedLeistung ? getLeistung(post.relatedLeistung) : undefined;

  return (
    <main>
      <article>
        <header className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '140px 0 70px' }}>
          <div style={container}>
            <nav aria-label="Brotkrumen" style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(245,242,236,0.5)', marginBottom: 26 }}>
              <Link to="/" style={{ color: 'rgba(245,242,236,0.5)' }}>Start</Link>
              <span style={{ padding: '0 8px' }}>/</span>
              <Link to="/blog" style={{ color: 'rgba(245,242,236,0.5)' }}>Ratgeber</Link>
            </nav>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: 'var(--gold)', marginBottom: 18 }}>
              {post.kategorie} · {post.lesezeit}
            </div>
            <Reveal as="h1" delay={40} style={{ fontSize: 'clamp(32px,4.6vw,60px)', letterSpacing: '-0.03em', lineHeight: 1.06, color: '#F5F2EC' }}>
              {post.title}
            </Reveal>
          </div>
        </header>

        <div style={{ background: 'var(--paper)', padding: '48px 0 90px' }}>
          <div style={{ ...container, maxWidth: 760 }}>
            <figure style={{ margin: '0 0 44px' }}>
              <img
                src={`/images/${post.bild}`}
                alt={post.bildAlt}
                style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12, display: 'block' }}
              />
              <figcaption style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--t-dim)', marginTop: 8 }}>
                SYMBOLBILD
              </figcaption>
            </figure>

            {/* Vorspann / Lead */}
            <Reveal as="p" style={{ fontSize: 'clamp(19px,2.2vw,22px)', lineHeight: 1.55, color: 'var(--t-ink)', fontWeight: 500, marginBottom: 34 }}>
              {post.excerpt}
            </Reveal>

            {/* Das Wichtigste in Kürze */}
            <Reveal style={{ background: 'var(--white)', border: '1px solid var(--line-ink)', borderLeft: '3px solid var(--gold)', borderRadius: 12, padding: '24px 26px', marginBottom: 48 }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', color: 'var(--gold-deep)', marginBottom: 14 }}>
                DAS WICHTIGSTE IN KÜRZE
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10 }}>
                {post.kurz.map((k, i) => (
                  <li key={i} style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--t-sub)' }}>{k}</li>
                ))}
              </ul>
            </Reveal>

            {post.sections.map((sec, i) => (
              <Reveal key={sec.h2} delay={20 + i * 20} style={{ marginBottom: 42 }}>
                <h2 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 'clamp(22px,2.6vw,30px)', letterSpacing: '-0.02em', color: 'var(--t-ink)', marginBottom: 16 }}>
                  {sec.h2}
                </h2>
                {sec.paras.map((p, j) => (
                  <p key={j} style={{ fontSize: 17.5, lineHeight: 1.8, color: 'var(--t-sub)', marginBottom: 16 }}>{p}</p>
                ))}
                {sec.list && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 22, display: 'grid', gap: 11 }}>
                    {sec.list.map((li, k) => (
                      <li key={k} style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--t-sub)' }}>{li}</li>
                    ))}
                  </ul>
                )}
                {sec.bild && (
                  <figure style={{ margin: '30px 0 4px' }}>
                    <img
                      src={`/images/${sec.bild}`}
                      alt={sec.bildAlt ?? ''}
                      loading="lazy"
                      style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12, display: 'block' }}
                    />
                    <figcaption style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--t-dim)', marginTop: 8 }}>
                      SYMBOLBILD
                    </figcaption>
                  </figure>
                )}
              </Reveal>
            ))}

            <Reveal style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--line-ink)' }}>
              <p style={{ fontFamily: mono, fontSize: 11.5, lineHeight: 1.7, color: 'var(--t-dim)' }}>
                Hinweis: Dieser Ratgeber bietet allgemeine, unverbindliche Informationen nach bestem Wissen (Stand 2026). Preisangaben sind grobe Richtwerte und kein Angebot; sie können je nach Objekt, Zustand, Region und Ausführung erheblich abweichen. Der Beitrag ersetzt keine individuelle Fach-, Steuer- oder Rechtsberatung.
              </p>
            </Reveal>

            {related && (
              <Reveal style={{ marginTop: 20, borderTop: '1px solid var(--line-ink)', paddingTop: 26 }}>
                <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)', letterSpacing: '0.06em', marginBottom: 10 }}>
                  PASSENDE LEISTUNG
                </div>
                <Link to={`/leistungen/${related.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: bricolage, fontWeight: 700, fontSize: 20, color: 'var(--t-ink)' }}>
                  {related.navTitle} <span aria-hidden style={{ color: 'var(--gold-deep)' }}>→</span>
                </Link>
              </Reveal>
            )}

            <Reveal style={{ marginTop: 34 }}>
              <Link to="/blog" style={{ fontFamily: mono, fontSize: 12.5, color: 'var(--gold-deep)' }}>← Alle Beiträge</Link>
            </Reveal>
          </div>
        </div>
      </article>

      <CtaBand />
    </main>
  );
}
