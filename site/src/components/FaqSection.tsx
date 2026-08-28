import Reveal from './Reveal'
import { SectionKicker } from './sections'
import type { FaqItem } from '../content'

const bricolage = "'Bricolage Grotesque',sans-serif"
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' }

// Sichtbare FAQ-Sektion (native <details>). Nutzt dieselben Daten wie der
// Prerender (siehe vite.config homeFaq) → Live-DOM = statisches HTML. Dient
// zugleich der GEO (extrahierbare Frage/Antwort-Paare für KI-Antwortmaschinen).
export default function FaqSection({
  faq,
  kicker = 'Häufige Fragen',
  title,
}: {
  faq: FaqItem[]
  kicker?: string
  title: string
}) {
  return (
    <section style={{ background: 'var(--paper)', padding: '104px 0' }}>
      <div style={{ ...container, maxWidth: 860 }}>
        <SectionKicker>{kicker}</SectionKicker>
        <Reveal
          as="h2"
          delay={40}
          style={{
            fontSize: 'clamp(28px,3.6vw,48px)',
            letterSpacing: '-0.025em',
            color: 'var(--t-ink)',
            marginBottom: 40,
          }}
        >
          {title}
        </Reveal>
        {faq.map((f, i) => (
          <Reveal key={f.frage} delay={40 + i * 40}>
            <details style={{ borderTop: '1px solid var(--line-ink)', padding: '20px 0' }}>
              <summary
                style={{
                  fontFamily: bricolage,
                  fontWeight: 600,
                  fontSize: 18,
                  color: 'var(--t-ink)',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                }}
              >
                {f.frage}
                <span aria-hidden style={{ color: 'var(--gold-deep)', flexShrink: 0 }}>
                  +
                </span>
              </summary>
              <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--t-sub)', marginTop: 14, maxWidth: 720 }}>
                {f.antwort}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
