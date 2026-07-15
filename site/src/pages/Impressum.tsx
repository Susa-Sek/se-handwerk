import Reveal from '../components/Reveal';

const mono = "'IBM Plex Mono',monospace";
const container: React.CSSProperties = { maxWidth: 860, margin: '0 auto', padding: '0 40px' };
const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8A97A3',
};
const label: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#8A97A3',
  marginBottom: 8,
};
const value: React.CSSProperties = { fontSize: 16, lineHeight: 1.7, color: '#EDF1F5' };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal style={{ padding: '26px 0', borderTop: '1px solid rgba(255,255,255,0.11)' }}>
      <div style={label}>{title}</div>
      <div style={value}>{children}</div>
    </Reveal>
  );
}

export default function Impressum() {
  return (
    <main>
      <section style={{ background: '#16222F', padding: '150px 0 110px' }}>
        <div style={container}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 22 }}>
            Rechtliches
          </Reveal>
          <Reveal
            as="h1"
            delay={60}
            style={{ fontSize: 'clamp(40px,6vw,80px)', letterSpacing: '-0.03em', color: '#EDF1F5' }}
          >
            Impressum
          </Reveal>

          <div style={{ marginTop: 48 }}>
            <Reveal as="p" style={{ ...kicker, marginBottom: 4 }}>
              Angaben gemäß § 5 TMG
            </Reveal>

            <Block title="Anbieter">
              SE Handwerk — Said &amp; Tuzcuoglu GbR
              <br />
              Steinsfeldstraße 21
              <br />
              74626 Bretzfeld
            </Block>

            <Block title="Vertreten durch">
              Sulieman Said
              <br />
              Emre Tuzcuoglu
            </Block>

            <Block title="Kontakt">
              Telefon:{' '}
              <a href="tel:+491734536225" style={{ color: '#DCB566' }}>
                +49 173 4536225
              </a>
              <br />
              E-Mail:{' '}
              <a href="mailto:kontakt@sehandwerk.de" style={{ color: '#DCB566' }}>
                kontakt@sehandwerk.de
              </a>
            </Block>

            <Block title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
              Sulieman Said
              <br />
              Anschrift wie oben
            </Block>

            <Reveal
              as="p"
              style={{
                marginTop: 32,
                fontFamily: mono,
                fontSize: 12,
                lineHeight: 1.7,
                color: '#6E7B88',
              }}
            >
              Plattform der EU-Kommission zur Online-Streitbeilegung:
              https://ec.europa.eu/consumers/odr. Zur Teilnahme an einem Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
