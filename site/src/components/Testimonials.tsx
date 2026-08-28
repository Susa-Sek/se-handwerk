import Reveal from './Reveal'
import { SectionKicker } from './sections'
import { bewertung, testimonials } from '../content'

const mono = "'IBM Plex Mono',monospace"
const bricolage = "'Bricolage Grotesque',sans-serif"
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' }

// Kundenstimmen-Sektion. Rendert NICHTS, solange keine echten Testimonials in
// content.ts eingetragen sind (Integrität: nichts erfinden). Sobald echte
// Einträge vorliegen, erscheint die Sektion automatisch.
export default function Testimonials() {
  if (testimonials.length === 0) return null

  return (
    <section style={{ background: 'var(--paper2)', padding: '104px 0' }}>
      <div style={container}>
        <SectionKicker>Kundenstimmen</SectionKicker>
        <Reveal
          as="h2"
          delay={40}
          style={{
            fontSize: 'clamp(28px,3.6vw,48px)',
            letterSpacing: '-0.025em',
            color: 'var(--t-ink)',
            marginBottom: 12,
          }}
        >
          Das sagen Auftraggeber.
        </Reveal>

        {bewertung && (
          <p style={{ fontFamily: mono, fontSize: 13, color: 'var(--t-sub)', marginBottom: 40 }}>
            {bewertung.schnitt.toFixed(1).replace('.', ',')} / 5 · {bewertung.anzahl} Bewertungen auf{' '}
            {bewertung.url ? (
              <a href={bewertung.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-deep)' }}>
                {bewertung.quelle}
              </a>
            ) : (
              bewertung.quelle
            )}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: 24,
            marginTop: bewertung ? 0 : 40,
          }}
        >
          {testimonials.map((t, i) => (
            <Reveal key={t.name + i} delay={40 + i * 40}>
              <figure
                style={{
                  margin: 0,
                  background: 'var(--paper)',
                  border: '1px solid var(--line-ink)',
                  borderRadius: 10,
                  padding: 28,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 20,
                }}
              >
                <blockquote
                  style={{
                    margin: 0,
                    fontFamily: bricolage,
                    fontWeight: 600,
                    fontSize: 18,
                    lineHeight: 1.5,
                    color: 'var(--t-ink)',
                  }}
                >
                  „{t.zitat}"
                </blockquote>
                <figcaption style={{ fontFamily: mono, fontSize: 12, color: 'var(--t-sub)', letterSpacing: '0.02em' }}>
                  {t.initialen || t.name}
                  {t.ort ? ` · ${t.ort}` : ''}
                  {t.leistung ? ` · ${t.leistung}` : ''}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
