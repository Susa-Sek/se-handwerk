import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { SectionKicker, CtaBand } from '../components/sections';
import { useSeo } from '../hooks/useSeo';

const mono = "'IBM Plex Mono',monospace";

export default function NotFound() {
  useSeo({
    title: 'Seite nicht gefunden | SE Handwerk',
    description: 'Diese Seite wurde nicht gefunden – hier geht es zurück zu SE Handwerk.',
    path: '/404',
    noindex: true,
  });

  const links: [string, string][] = [
    ['/', 'Zur Startseite'],
    ['/#leistungen', 'Leistungen'],
    ['/blog', 'Ratgeber'],
    ['/kontakt', 'Kontakt'],
  ];

  return (
    <main>
      <section className="grain" style={{ background: 'var(--ink)', color: '#F5F2EC', padding: '160px 0 110px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px' }}>
          <SectionKicker dark>Fehler 404</SectionKicker>
          <Reveal as="h1" delay={40} style={{ fontSize: 'clamp(38px,5.4vw,80px)', letterSpacing: '-0.03em', lineHeight: 1.02, color: '#F5F2EC', maxWidth: 900 }}>
            Diese Seite gibt es nicht (mehr).
          </Reveal>
          <Reveal as="p" delay={110} style={{ fontSize: 18, lineHeight: 1.65, color: 'rgba(245,242,236,0.66)', maxWidth: 560, marginTop: 26 }}>
            Vielleicht wurde sie verschoben oder die Adresse hat sich vertippt. Hier geht es weiter:
          </Reveal>
          <Reveal delay={170} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 34 }}>
            {links.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.02em', color: '#F5F2EC', border: '1px solid rgba(245,242,236,0.22)', padding: '10px 18px', borderRadius: 100 }}
              >
                {label} →
              </Link>
            ))}
          </Reveal>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
