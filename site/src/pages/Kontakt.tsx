import Reveal from '../components/Reveal';
import ContactForm from '../components/ContactForm';

const mono = "'IBM Plex Mono',monospace";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };
const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A97A3',
};

const rows = [
  { label: 'TELEFON', value: '+49 173 4536225', href: 'tel:+491734536225' },
  { label: 'E-MAIL', value: 'kontakt@sehandwerk.de', href: 'mailto:kontakt@sehandwerk.de' },
];

export default function Kontakt() {
  return (
    <main>
      <section style={{ background: '#16222F', padding: '150px 0 112px' }}>
        <div
          style={{
            ...container,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
            gap: 60,
          }}
        >
          <div>
            <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
              Kontakt
            </Reveal>
            <Reveal
              as="h1"
              delay={60}
              style={{
                fontSize: 'clamp(40px,5.5vw,80px)',
                letterSpacing: '-0.03em',
                marginBottom: 24,
                color: '#EDF1F5',
              }}
            >
              Kontakt.
            </Reveal>
            <Reveal
              as="p"
              delay={120}
              style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD', maxWidth: 420, marginBottom: 40 }}
            >
              Sie haben ein Projekt, über das Sie sprechen möchten? Melden Sie sich — gerne per Telefon,
              das geht am schnellsten. Wir melden uns innerhalb von 24 Stunden.
            </Reveal>
            <Reveal delay={180} style={{ display: 'flex', flexDirection: 'column' }}>
              {rows.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  className="contact-line"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 0',
                    borderTop: '1px solid rgba(255,255,255,0.11)',
                  }}
                >
                  <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3', letterSpacing: '0.06em' }}>
                    {r.label}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 15 }}>{r.value}</span>
                </a>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 0',
                  borderTop: '1px solid rgba(255,255,255,0.11)',
                  borderBottom: '1px solid rgba(255,255,255,0.11)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3', letterSpacing: '0.06em' }}>
                  EINSATZGEBIET
                </span>
                <span style={{ fontFamily: mono, fontSize: 14, color: '#AEB9C3', textAlign: 'right' }}>
                  SE Handwerk
                  <br />
                  Raum Heilbronn und Umgebung
                </span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
