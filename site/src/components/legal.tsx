import type { CSSProperties, ReactNode } from 'react';
import Reveal from './Reveal';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

// Shared styling for the legal pages (Impressum, Datenschutz).
export const legalStyles: Record<string, CSSProperties> = {
  container: { maxWidth: 820, margin: '0 auto', padding: '0 40px' },
  p: { fontSize: 15.5, lineHeight: 1.75, color: '#B9C3CD', marginBottom: 14 },
  strong: { color: '#EDF1F5', fontWeight: 600 },
  a: { color: '#DCB566', wordBreak: 'break-word' },
  sub: {
    fontFamily: bricolage,
    fontWeight: 700,
    fontSize: 16,
    color: '#EDF1F5',
    letterSpacing: '-0.01em',
    marginBottom: 8,
  },
  li: { fontSize: 15.5, lineHeight: 1.7, color: '#B9C3CD', marginBottom: 6 },
};

const kickerStyle: CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A97A3',
};

export function LegalHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <section style={{ background: '#16222F', padding: '150px 0 60px' }}>
      <div style={legalStyles.container}>
        <Reveal style={{ fontFamily: mono, fontSize: 11, color: '#7E8B98', letterSpacing: '0.05em', marginBottom: 20 }}>
          <a href="/" style={{ color: '#7E8B98' }}>
            Startseite
          </a>{' '}
          / {title}
        </Reveal>
        <Reveal delay={40} style={{ ...kickerStyle, marginBottom: 18 }}>
          {kicker}
        </Reveal>
        <Reveal
          as="h1"
          delay={80}
          style={{ fontSize: 'clamp(38px,5.5vw,72px)', letterSpacing: '-0.03em', color: '#EDF1F5' }}
        >
          {title}
        </Reveal>
      </div>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal style={{ padding: '30px 0', borderTop: '1px solid rgba(255,255,255,0.11)' }}>
      <h2
        style={{
          fontFamily: bricolage,
          fontWeight: 700,
          fontSize: 'clamp(19px,2.4vw,24px)',
          color: '#EDF1F5',
          letterSpacing: '-0.015em',
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {children}
    </Reveal>
  );
}
