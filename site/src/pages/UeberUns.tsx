import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

const mono = "'IBM Plex Mono',monospace";
const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };
const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A97A3',
};

export default function UeberUns() {
  return (
    <main>
      <section style={{ background: '#16222F', padding: '150px 0 120px' }}>
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

          <Reveal delay={260} style={{ marginTop: 56 }}>
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
