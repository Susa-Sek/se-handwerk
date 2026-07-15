import Reveal from './Reveal';
import ContactForm from './ContactForm';
import Figure from './Figure';
import { ablauf, leistungen, regionen, vorteile, zielgruppen } from '../content';

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

export function ProblemSection() {
  return (
    <section style={{ background: '#16222F', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ maxWidth: 900 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 22 }}>
            Das Problem
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', maxWidth: 840, color: '#EDF1F5' }}>
            Sanierungen scheitern nicht am Handwerk. Sie scheitern an fehlender Koordination.
          </Reveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              gap: 48,
              marginTop: 48,
            }}
          >
            <Reveal as="p" delay={120} style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD' }}>
              Der Bodenleger kommt, aber der Estrich ist noch feucht. Der Maler steht vor der Tür,
              während der Trockenbau noch läuft. Der Fliesenleger sagt kurzfristig ab, und niemand hat
              einen Ersatz. Am Ende zieht sich ein Projekt, das acht Wochen dauern sollte, über ein
              halbes Jahr — und der Bauherr ist der, der alles zusammenhalten muss.
            </Reveal>
            <Reveal delay={200}>
              <p
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 23,
                  lineHeight: 1.35,
                  color: '#EDF1F5',
                  marginBottom: 18,
                  letterSpacing: '-0.01em',
                }}
              >
                Genau da setzen wir an.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD' }}>
                Wir planen den Ablauf, stimmen die Gewerke aufeinander ab, überwachen die Ausführung und
                stehen für das Ergebnis gerade. Sie haben eine Nummer, die Sie anrufen. Und ein Datum,
                an dem fertig ist.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LeistungenSection() {
  return (
    <section id="leistungen" style={{ background: '#1B2937', padding: '112px 0' }}>
      <div style={container}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 52,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
              Leistungsumfang
            </Reveal>
            <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', color: '#EDF1F5' }}>
              Was wir übernehmen.
            </Reveal>
          </div>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3', letterSpacing: '0.05em' }}>
            5 POSITIONEN
          </span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.13)' }}>
          {leistungen.map((l) => (
            <Reveal
              key={l.code}
              delay={l.delay}
              className="leistung-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '64px minmax(200px,300px) 1fr',
                gap: 28,
                alignItems: 'baseline',
                padding: '28px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.11)',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 12, color: '#C99A45', letterSpacing: '0.05em' }}>
                {l.code}
              </span>
              <h3
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 23,
                  color: '#EDF1F5',
                  letterSpacing: '-0.015em',
                }}
              >
                {l.title}
              </h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: '#AEB9C3', maxWidth: 560 }}>{l.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AblaufSection() {
  return (
    <section id="ablauf" style={{ background: '#16222F', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ marginBottom: 52 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Ablauf in vier Takten
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', color: '#EDF1F5' }}>
            So läuft es ab.
          </Reveal>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 0,
            borderTop: '1px solid rgba(255,255,255,0.16)',
          }}
        >
          {ablauf.map((a) => (
            <Reveal
              key={a.num}
              delay={a.delay}
              style={{ padding: '30px 26px 40px', borderRight: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div
                style={{
                  fontFamily: bricolage,
                  fontWeight: 800,
                  fontSize: 46,
                  color: '#C99A45',
                  lineHeight: 1,
                  marginBottom: 22,
                  letterSpacing: '-0.03em',
                }}
              >
                {a.num}
              </div>
              <h3
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 21,
                  color: '#EDF1F5',
                  marginBottom: 14,
                  letterSpacing: '-0.015em',
                }}
              >
                {a.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#AEB9C3' }}>{a.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EigentuemerSection() {
  return (
    <section id="eigentuemer" style={{ background: '#1B2937', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ maxWidth: 780, marginBottom: 52 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Für wen wir arbeiten
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', color: '#EDF1F5' }}>
            Für Eigentümer, die keine Zeit für Baustellen haben.
          </Reveal>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
            gap: 24,
          }}
        >
          {zielgruppen.map((z) => (
            <Reveal
              key={z.code}
              delay={z.delay}
              className="ziel-card"
              style={{
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 6,
                padding: '30px 26px',
                background: '#223141',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: '#14202E',
                  background: '#C99A45',
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  marginBottom: 22,
                }}
              >
                {z.code}
              </div>
              <h3
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#EDF1F5',
                  lineHeight: 1.2,
                  marginBottom: 16,
                  letterSpacing: '-0.015em',
                }}
              >
                {z.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#AEB9C3' }}>{z.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WarumSESection() {
  return (
    <section style={{ background: '#16222F', padding: '112px 0' }}>
      <div
        style={{
          ...container,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 60,
          alignItems: 'center',
        }}
      >
        <div>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Warum SE Handwerk
          </Reveal>
          <Reveal
            as="h2"
            delay={60}
            style={{ fontSize: 'clamp(28px,3.4vw,46px)', marginBottom: 36, color: '#EDF1F5' }}
          >
            Verantwortung bis zur Abnahme.
          </Reveal>
          <div>
            {vorteile.map((v) => (
              <Reveal
                key={v.n}
                delay={v.delay}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr',
                  gap: 16,
                  padding: '22px 0',
                  borderTop: '1px solid rgba(255,255,255,0.11)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 12, color: '#C99A45' }}>{v.n}</span>
                <div>
                  <h3
                    style={{
                      fontFamily: bricolage,
                      fontWeight: 700,
                      fontSize: 19,
                      color: '#EDF1F5',
                      marginBottom: 6,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {v.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#AEB9C3' }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={120}>
          <Figure
            src="detail-uebergabe.jpg"
            ratio="4/5"
            abb="ABB. 02 / 4:5"
            caption="Fertig saniertes Detail bei der Übergabe — ruhiges Tageslicht, gleiche Farbtemperatur"
          />
        </Reveal>
      </div>
    </section>
  );
}

export function RegionSection() {
  return (
    <section style={{ background: '#1B2937', padding: '100px 0' }}>
      <div
        style={{
          ...container,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: 56,
          alignItems: 'center',
        }}
      >
        <div>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Einsatzgebiet
          </Reveal>
          <Reveal
            as="h2"
            delay={60}
            style={{ fontSize: 'clamp(28px,3.4vw,46px)', marginBottom: 24, color: '#EDF1F5' }}
          >
            Im Raum Heilbronn und Umgebung.
          </Reveal>
          <Reveal as="p" delay={120} style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD', maxWidth: 460 }}>
            Wir sind in Bretzfeld ansässig und arbeiten im gesamten Raum Heilbronn, Hohenlohe,
            Neckarsulm, Sinsheim und Stuttgart.
          </Reveal>
          <Reveal delay={180} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
            {regionen.map((r) => (
              <span
                key={r}
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: '#AEB9C3',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '8px 14px',
                  borderRadius: 100,
                }}
              >
                {r}
              </span>
            ))}
          </Reveal>
        </div>
        <Reveal
          delay={140}
          style={{
            aspectRatio: '1/1',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.11)',
            borderRadius: 6,
            background: '#16222F',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.055) 1px,transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: '58%',
              height: '58%',
              border: '1px solid rgba(201,154,69,0.40)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: '30%',
              height: '30%',
              border: '1px solid rgba(201,154,69,0.55)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 10,
              height: 10,
              background: '#C99A45',
              borderRadius: '50%',
              boxShadow: '0 0 0 6px rgba(201,154,69,0.16)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 'calc(50% + 14px)',
              top: 'calc(50% - 28px)',
              fontFamily: mono,
              fontSize: 11,
              color: '#C99A45',
              letterSpacing: '0.05em',
            }}
          >
            BRETZFELD
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              fontFamily: mono,
              fontSize: 10.5,
              color: '#7E8B98',
              letterSpacing: '0.05em',
            }}
          >
            49.18°N / 9.44°E — RADIUS ~60 KM
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ErgebnisBand() {
  return (
    <section style={{ background: '#101A26', padding: '0 0 4px' }}>
      <div style={container}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '90px 0 24px',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Reveal delay={0} style={{ ...kicker }}>
            Das Ergebnis
          </Reveal>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#7E8B98', letterSpacing: '0.05em' }}>
            BEZUGSFERTIG ÜBERGEBEN
          </span>
        </div>
        <Reveal delay={80}>
          <Figure
            src="interior-01.jpg"
            ratio="16/7"
            abb="ABB. 03 / ERGEBNIS"
            caption="Fertig saniertes Objekt, bezugsfertig übergeben — ruhiges Tageslicht, architektonische Perspektive"
          />
        </Reveal>
      </div>
    </section>
  );
}

export function KontaktSection() {
  return (
    <section id="kontakt" style={{ background: '#16222F', padding: '112px 0' }}>
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
            as="h2"
            delay={60}
            style={{ fontSize: 'clamp(30px,3.8vw,52px)', marginBottom: 24, color: '#EDF1F5' }}
          >
            Sprechen wir über Ihr Projekt.
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            style={{ fontSize: 16.5, lineHeight: 1.7, color: '#B9C3CD', maxWidth: 400, marginBottom: 40 }}
          >
            Erzählen Sie uns kurz, was ansteht. Wir melden uns innerhalb von 24 Stunden und vereinbaren
            einen Termin vor Ort.
          </Reveal>
          <Reveal delay={180} style={{ display: 'flex', flexDirection: 'column' }}>
            <ContactRow label="TELEFON" value="+49 173 4536225" href="tel:+491734536225" top />
            <ContactRow label="E-MAIL" value="kontakt@sehandwerk.de" href="mailto:kontakt@sehandwerk.de" top />
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
                ADRESSE
              </span>
              <span style={{ fontFamily: mono, fontSize: 14, color: '#AEB9C3' }}>
                Steinsfeldstraße 21, 74626 Bretzfeld
              </span>
            </div>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

function ContactRow({
  label,
  value,
  href,
  top,
}: {
  label: string;
  value: string;
  href: string;
  top?: boolean;
}) {
  return (
    <a
      href={href}
      className="contact-line"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderTop: top ? '1px solid rgba(255,255,255,0.11)' : undefined,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontFamily: mono, fontSize: 15 }}>{value}</span>
    </a>
  );
}
