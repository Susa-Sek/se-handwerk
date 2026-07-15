import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };
const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A97A3',
};

const founders = [
  {
    title: 'Kalkulation & Kundenbetreuung',
    role: 'Erster Ansprechpartner',
    desc: 'Erster Ansprechpartner für unsere Auftraggeber. Nimmt Projekte auf, kalkuliert den Umfang und hält den Kontakt über die gesamte Laufzeit.',
    delay: 0,
  },
  {
    title: 'Bauleitung',
    role: 'Koordination vor Ort',
    desc: 'Verantwortet die Bauleitung und die Koordination auf der Baustelle. Sorgt dafür, dass die Gewerke ineinandergreifen und der Ablauf hält.',
    delay: 100,
  },
];

export default function UeberUns() {
  return (
    <main>
      <section style={{ background: '#16222F', padding: '150px 0 96px' }}>
        <div style={container}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 22 }}>
            Über uns
          </Reveal>
          <Reveal
            as="h1"
            delay={60}
            style={{
              fontSize: 'clamp(40px,6vw,88px)',
              letterSpacing: '-0.03em',
              color: '#EDF1F5',
              maxWidth: '16ch',
            }}
          >
            Wer wir sind.
          </Reveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
              gap: 56,
              marginTop: 56,
              alignItems: 'start',
            }}
          >
            <Reveal as="p" delay={120} style={{ fontSize: 18, lineHeight: 1.7, color: '#B9C3CD' }}>
              SE Handwerk entstand aus einer einfachen Beobachtung: Auf dem Bau gibt es genug gute
              Handwerker. Was fehlt, ist jemand, der sie zusammenhält.
            </Reveal>
            <Reveal delay={200}>
              <p style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD', marginBottom: 22 }}>
                Wir arbeiten mit einem festen Kreis an Fachleuten, die wir sorgfältig ausgewählt haben.
                Jeder Einzelne ist geprüft, jeder hat sich auf unseren Baustellen bewiesen. Wer nicht
                liefert, ist bei uns raus — und genau deshalb können wir für das Ergebnis geradestehen.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD' }}>
                Unsere Aufgabe: die richtigen Leute zur richtigen Zeit an die richtige Stelle bringen und
                dafür sorgen, dass am Ende steht, was am Anfang besprochen wurde. Das klingt
                unspektakulär. Es ist aber der Unterschied zwischen einer Sanierung, die läuft, und
                einer, die sich zieht.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section style={{ background: '#1B2937', padding: '96px 0' }}>
        <div style={container}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Die Gründer
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(28px,3.4vw,46px)', color: '#EDF1F5', marginBottom: 48 }}>
            Zwei Verantwortliche. Klare Zuständigkeiten.
          </Reveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              gap: 24,
            }}
          >
            {founders.map((f) => (
              <Reveal
                key={f.title}
                delay={f.delay}
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 6,
                  padding: '32px 30px',
                  background: '#223141',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: '#C99A45',
                    letterSpacing: '0.05em',
                    marginBottom: 20,
                  }}
                >
                  {f.role}
                </div>
                <h3
                  style={{
                    fontFamily: bricolage,
                    fontWeight: 700,
                    fontSize: 26,
                    color: '#EDF1F5',
                    letterSpacing: '-0.02em',
                    marginBottom: 16,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.65, color: '#AEB9C3' }}>{f.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160} style={{ marginTop: 56 }}>
            <Link
              to="/kontakt"
              className="btn-primary"
              style={{
                fontFamily: mono,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '16px 28px',
                borderRadius: 100,
                display: 'inline-block',
              }}
            >
              Projekt besprechen
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
