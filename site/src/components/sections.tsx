import Reveal from './Reveal';
import ContactForm from './ContactForm';
import { useViewportProgress } from '../hooks/useViewportProgress';
import { clamp } from '../lib/motion';
import { ablauf, regionen, vorteile, zielgruppen } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };

const kicker: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6C7883',
};

// Sheet-register line — every content section is a numbered Blatt in the
// Bauakte, the brand's drawing-sheet metaphor made structural.
export function Register({ n, label }: { n: number; label: string }) {
  return (
    <Reveal className="register" style={{ marginBottom: 18 }}>
      Blatt {String(n).padStart(2, '0')} / 07 · {label}
    </Reveal>
  );
}

export function ProblemSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const ghostDrift = ((p - 0.5) * -44).toFixed(1);
  const headDrift = ((p - 0.5) * 12).toFixed(1);

  return (
    <section ref={ref} style={{ position: 'relative', background: '#F6F2EA', padding: '128px 0 104px', overflow: 'clip' }}>
      <div aria-hidden className="ghost" style={{ right: '-0.06em', top: -24, transform: `translateY(${ghostDrift}px)` }}>
        01
      </div>
      <div className="sec-body" style={container}>
        <Register n={1} label="Das Problem" />
        <Reveal
          as="h2"
          delay={40}
          style={{
            fontSize: 'clamp(32px,4.6vw,62px)',
            maxWidth: '16ch',
            color: '#1E2A35',
            transform: `translateY(${headDrift}px)`,
            willChange: 'transform',
          }}
        >
          Sanierungen scheitern nicht am Handwerk. Sie scheitern an fehlender Koordination.
        </Reveal>
        <div className="g12" style={{ marginTop: 56 }}>
          <Reveal as="p" from="left" delay={100} className="c2-8" style={{ fontSize: 16.5, lineHeight: 1.75, color: '#47535E', maxWidth: 560 }}>
            Der Bodenleger kommt, aber der Estrich ist noch feucht. Der Maler steht vor der Tür,
            während der Trockenbau noch läuft. Der Fliesenleger sagt kurzfristig ab, und niemand hat
            einen Ersatz. Am Ende zieht sich ein Projekt, das acht Wochen dauern sollte, über ein
            halbes Jahr — und der Bauherr ist der, der alles zusammenhalten muss.
          </Reveal>
          <Reveal from="right" delay={220} className="c8-13 push-s" style={{ borderLeft: '1px solid rgba(201,154,69,0.55)', paddingLeft: 26 }}>
            <p
              style={{
                fontFamily: bricolage,
                fontWeight: 700,
                fontSize: 23,
                lineHeight: 1.35,
                color: '#1E2A35',
                marginBottom: 18,
                letterSpacing: '-0.01em',
              }}
            >
              Genau da setzen wir an.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#47535E' }}>
              Wir planen den Ablauf, stimmen die Gewerke aufeinander ab, überwachen die Ausführung und
              stehen für das Ergebnis gerade. Sie haben eine Nummer, die Sie anrufen. Und ein Datum,
              an dem fertig ist.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// A gold timeline that draws across the four Takte as the section scrolls into
// view, lighting each beat in turn.
function AblaufConnector({ count }: { count: number }) {
  const [ref, progress] = useViewportProgress<HTMLDivElement>();
  const fill = clamp((progress - 0.16) / 0.46, 0, 1);
  return (
    <div
      ref={ref}
      style={{ position: 'relative', height: 2, background: 'rgba(20,26,32,0.16)', marginBottom: 2 }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${(fill * 100).toFixed(1)}%`,
          background: '#C99A45',
          boxShadow: '0 0 10px rgba(201,154,69,0.5)',
        }}
      />
      {Array.from({ length: count }, (_, i) => {
        const at = (i + 0.5) / count;
        const lit = fill >= at - 0.005;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${(at * 100).toFixed(2)}%`,
              top: '50%',
              width: 9,
              height: 9,
              marginLeft: -4.5,
              marginTop: -4.5,
              borderRadius: '50%',
              background: lit ? '#C99A45' : '#3A4652',
              boxShadow: lit ? '0 0 9px 1px rgba(201,154,69,0.6)' : 'none',
              transition: 'background .3s ease, box-shadow .3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// The four Takte hang from the timeline at increasing depth — the section
// reads like a construction schedule instead of four equal columns.
const taktDrops = [14, 58, 106, 154];

export function AblaufSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const headDrift = ((p - 0.5) * 14).toFixed(1);

  return (
    <section ref={ref} id="ablauf" style={{ background: '#F6F2EA', padding: '112px 0 140px' }}>
      <div style={container}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 52,
            transform: `translateY(${headDrift}px)`,
            willChange: 'transform',
          }}
        >
          <div>
            <Register n={3} label="Ablauf in vier Takten" />
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(32px,4.6vw,62px)', color: '#1E2A35' }}>
              So läuft es ab.
            </Reveal>
          </div>
          <span style={{ ...kicker, fontSize: 11 }}>Diesen Plan bekommen Sie schriftlich</span>
        </div>
        <AblaufConnector count={ablauf.length} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 0,
          }}
        >
          {ablauf.map((a, i) => (
            <div key={a.num}>
              <span className="takt-drop" style={{ height: taktDrops[i] }} />
              <Reveal
                delay={a.delay}
                from={i % 2 === 0 ? 'up' : 'scale'}
                style={{ padding: '16px 26px 40px' }}
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
                    color: '#1E2A35',
                    marginBottom: 14,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {a.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#525E69' }}>{a.desc}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Audience cards sized by importance: investors (the primary audience) get the
// widest card, the others step down and drop lower — unequal on purpose.
const zielLayout = [
  { cls: 'c1-6', pad: '38px 34px', title: 24, drift: 10 },
  { cls: 'c6-10 push-s', pad: '32px 28px', title: 20, drift: -16 },
  { cls: 'c10-13 push-m', pad: '28px 24px', title: 18, drift: 22 },
];

export function EigentuemerSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const ghostDrift = ((p - 0.5) * 38).toFixed(1);

  return (
    <section ref={ref} id="eigentuemer" style={{ position: 'relative', background: '#EFE9DE', padding: '104px 0 132px', overflow: 'clip' }}>
      <div aria-hidden className="ghost" style={{ left: '-0.04em', bottom: -30, transform: `translateY(${ghostDrift}px)` }}>
        04
      </div>
      <div className="sec-body" style={container}>
        <div style={{ maxWidth: 720, marginBottom: 64 }}>
          <Register n={4} label="Für wen wir arbeiten" />
          <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(32px,4.6vw,62px)', color: '#1E2A35' }}>
            Für Eigentümer, die keine Zeit für Baustellen haben.
          </Reveal>
        </div>
        <div className="g12">
          {zielgruppen.map((z, i) => {
            const l = zielLayout[i];
            const drift = ((p - 0.5) * l.drift).toFixed(1);
            return (
              <div key={z.code} className={l.cls} style={{ transform: `translateY(${drift}px)`, willChange: 'transform' }}>
                <Reveal
                  delay={z.delay}
                  from={i === 1 ? 'up' : 'scale'}
                  className="ziel-card card-white"
                  style={{ padding: l.pad, height: '100%' }}
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
                      fontSize: l.title,
                      color: '#1E2A35',
                      lineHeight: 1.2,
                      marginBottom: 16,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {z.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#525E69' }}>{z.desc}</p>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WarumSESection() {
  return (
    <section style={{ background: '#F6F2EA', padding: '132px 0 110px' }}>
      <div style={container}>
        <div className="g12">
          {/* pinned intro — stays fixed while the reasons scroll past */}
          <div className="c1-5 warum-sticky">
            <Register n={5} label="Warum SE Handwerk" />
            <Reveal
              as="h2"
              delay={40}
              style={{ fontSize: 'clamp(30px,3.8vw,52px)', marginBottom: 26, color: '#1E2A35' }}
            >
              Verantwortung bis zur Abnahme.
            </Reveal>
            <Reveal delay={120} style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360 }}>
              <span style={{ width: 8, height: 12, borderLeft: '1px solid rgba(201,154,69,0.6)', flexShrink: 0 }} />
              <span style={{ flex: 1, height: 1, background: 'rgba(201,154,69,0.4)' }} />
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: '#B0791E', whiteSpace: 'nowrap' }}>
                4 GRÜNDE
              </span>
            </Reveal>
          </div>

          {/* the four reasons scroll past the pinned intro */}
          <div className="c7-13">
            {vorteile.map((v, i) => (
              <Reveal
                key={v.n}
                from={i % 2 === 0 ? 'right' : 'up'}
                delay={v.delay}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr',
                  gap: 16,
                  padding: '34px 0',
                  borderTop: '1px solid rgba(20,26,32,0.11)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 12, color: '#B0791E' }}>{v.n}</span>
                <div>
                  <h3
                    style={{
                      fontFamily: bricolage,
                      fontWeight: 700,
                      fontSize: 19,
                      color: '#1E2A35',
                      marginBottom: 6,
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {v.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: '#525E69' }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Towns placed by rough compass direction from Heilbronn.
const regionCities = [
  { name: 'Neckarsulm', x: 60, y: 30 },
  { name: 'Sinsheim', x: 24, y: 45 },
  { name: 'Stuttgart', x: 55, y: 78 },
];

export function RegionSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const textDrift = ((p - 0.5) * 22).toFixed(1);
  const mapDrift = ((p - 0.5) * -28).toFixed(1);

  return (
    <section ref={ref} style={{ background: '#EFE9DE', padding: '136px 0 112px' }}>
      <div style={container}>
        <div className="g12" style={{ alignItems: 'center' }}>
          <div className="c1-5" style={{ transform: `translateY(${textDrift}px)`, willChange: 'transform' }}>
            <Register n={6} label="Einsatzgebiet" />
            <Reveal
              as="h2"
              delay={40}
              style={{ fontSize: 'clamp(30px,3.8vw,52px)', marginBottom: 24, color: '#1E2A35', maxWidth: '11ch' }}
            >
              Im Raum Heilbronn und Umgebung.
            </Reveal>
            <Reveal as="p" delay={110} style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E', maxWidth: 400 }}>
              Wir arbeiten im gesamten Raum Heilbronn und Umgebung — von Neckarsulm über Sinsheim
              bis Stuttgart.
            </Reveal>
            <Reveal delay={170} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
              {regionen.map((r) => (
                <span
                  key={r}
                  style={{
                    fontFamily: mono,
                    fontSize: 12,
                    color: '#525E69',
                    border: '1px solid rgba(20,26,32,0.15)',
                    padding: '8px 14px',
                    borderRadius: 100,
                    background: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {r}
                </span>
              ))}
            </Reveal>
          </div>

          <div className="c6-12" style={{ transform: `translateY(${mapDrift}px)`, willChange: 'transform' }}>
            <Reveal from="scale" delay={120} className="region-map">
              {/* faint drafting grid */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(20,26,32,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,32,0.05) 1px,transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
              {/* range rings — ink, with a single gold accent ring */}
              {[
                { s: '84%', c: 'rgba(20,26,32,0.10)' },
                { s: '54%', c: 'rgba(201,154,69,0.55)' },
                { s: '26%', c: 'rgba(20,26,32,0.14)' },
              ].map((r) => (
                <div
                  key={r.s}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: r.s,
                    height: r.s,
                    transform: 'translate(-50%,-50%)',
                    border: `1px solid ${r.c}`,
                    borderRadius: '50%',
                  }}
                />
              ))}
              {/* dashed connector lines from Heilbronn to each town */}
              <svg
                aria-hidden
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                {regionCities.map((c) => (
                  <line
                    key={c.name}
                    x1="50"
                    y1="50"
                    x2={c.x}
                    y2={c.y}
                    stroke="rgba(201,154,69,0.6)"
                    strokeWidth="0.3"
                    strokeDasharray="1.3 1.3"
                  />
                ))}
              </svg>
              {/* town markers */}
              {regionCities.map((c) => (
                <div
                  key={c.name}
                  style={{
                    position: 'absolute',
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    transform: 'translate(-50%,-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1E2A35', flexShrink: 0 }} />
                  <span style={{ fontFamily: mono, fontSize: 10.5, color: '#47535E', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                </div>
              ))}
              {/* centre — Heilbronn */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 13,
                  height: 13,
                  background: '#C99A45',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 5px rgba(201,154,69,0.18), 0 0 18px 3px rgba(201,154,69,0.55)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(50% + 16px)',
                  top: 'calc(50% - 28px)',
                  fontFamily: mono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#B0791E',
                  letterSpacing: '0.05em',
                }}
              >
                HEILBRONN
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  fontFamily: mono,
                  fontSize: 10.5,
                  color: '#8A929B',
                  letterSpacing: '0.05em',
                }}
              >
                49.14°N / 9.22°E — RADIUS ~60 KM
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function KontaktSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const textDrift = ((p - 0.5) * 16).toFixed(1);
  const formDrift = ((p - 0.5) * -12).toFixed(1);

  return (
    <section ref={ref} id="kontakt" style={{ position: 'relative', background: '#F6F2EA', padding: '120px 0 140px', overflow: 'clip' }}>
      <div aria-hidden className="ghost" style={{ right: '-0.05em', bottom: -40 }}>
        07
      </div>
      <div className="sec-body" style={container}>
        <div className="g12">
          <div className="c1-5" style={{ transform: `translateY(${textDrift}px)`, willChange: 'transform' }}>
            <Register n={7} label="Kontakt" />
            <Reveal
              as="h2"
              delay={40}
              style={{ fontSize: 'clamp(30px,3.8vw,52px)', marginBottom: 24, color: '#1E2A35' }}
            >
              Sprechen wir über Ihr Projekt.
            </Reveal>
            <Reveal
              as="p"
              delay={110}
              style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E', maxWidth: 400, marginBottom: 40 }}
            >
              Erzählen Sie uns kurz, was ansteht. Wir melden uns innerhalb von 24 Stunden und vereinbaren
              einen Termin vor Ort.
            </Reveal>
            <Reveal delay={170} style={{ display: 'flex', flexDirection: 'column' }}>
              <ContactRow label="TELEFON" value="+49 173 4536225" href="tel:+491734536225" top />
              <ContactRow label="E-MAIL" value="kontakt@sehandwerk.de" href="mailto:kontakt@sehandwerk.de" top />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 0',
                  borderTop: '1px solid rgba(20,26,32,0.11)',
                  borderBottom: '1px solid rgba(20,26,32,0.11)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 11, color: '#6C7883', letterSpacing: '0.06em' }}>
                  EINSATZGEBIET
                </span>
                <span style={{ fontFamily: mono, fontSize: 14, color: '#525E69' }}>
                  Raum Heilbronn und Umgebung
                </span>
              </div>
            </Reveal>
          </div>
          <div className="c6-12 push-s" style={{ transform: `translateY(${formDrift}px)`, willChange: 'transform' }}>
            <Reveal delay={120}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
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
        borderTop: top ? '1px solid rgba(20,26,32,0.11)' : undefined,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 11, color: '#6C7883', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontFamily: mono, fontSize: 15 }}>{value}</span>
    </a>
  );
}
