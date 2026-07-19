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

export function ProblemSection() {
  return (
    <section style={{ background: '#F6F2EA', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ maxWidth: 900 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 22 }}>
            Das Problem
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', maxWidth: 840, color: '#1E2A35' }}>
            Sanierungen scheitern nicht am Handwerk. Sie scheitern an fehlender Koordination.
          </Reveal>
          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
              gap: 48,
              marginTop: 48,
            }}
          >
            <Reveal from="grow" delay={140} className="problem-divider" />
            <Reveal as="p" from="left" delay={120} style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E' }}>
              Der Bodenleger kommt, aber der Estrich ist noch feucht. Der Maler steht vor der Tür,
              während der Trockenbau noch läuft. Der Fliesenleger sagt kurzfristig ab, und niemand hat
              einen Ersatz. Am Ende zieht sich ein Projekt, das acht Wochen dauern sollte, über ein
              halbes Jahr — und der Bauherr ist der, der alles zusammenhalten muss.
            </Reveal>
            <Reveal from="right" delay={200}>
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
              <p style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E' }}>
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

// A gold timeline that draws across the four Takte as the section scrolls into
// view, lighting each beat in turn — a scroll-scrubbed replacement for the
// static top border, reinforcing the "Ablauf in vier Takten" idea.
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

export function AblaufSection() {
  return (
    <section id="ablauf" style={{ background: '#F6F2EA', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ marginBottom: 52 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Ablauf in vier Takten
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', color: '#1E2A35' }}>
            So läuft es ab.
          </Reveal>
        </div>
        <AblaufConnector count={ablauf.length} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 0,
          }}
        >
          {ablauf.map((a) => (
            <Reveal
              key={a.num}
              delay={a.delay}
              from="up"
              style={{ padding: '30px 26px 40px', borderRight: '1px solid rgba(20,26,32,0.10)' }}
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
          ))}
        </div>
      </div>
    </section>
  );
}

export function EigentuemerSection() {
  return (
    <section id="eigentuemer" style={{ background: '#EFE9DE', padding: '112px 0' }}>
      <div style={container}>
        <div style={{ maxWidth: 780, marginBottom: 52 }}>
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Für wen wir arbeiten
          </Reveal>
          <Reveal as="h2" delay={60} style={{ fontSize: 'clamp(30px,4vw,54px)', color: '#1E2A35' }}>
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
              from="scale"
              className="ziel-card"
              style={{
                border: '1px solid rgba(20,26,32,0.10)',
                borderRadius: 6,
                padding: '30px 26px',
                background: '#FFFFFF',
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
          ))}
        </div>
      </div>
    </section>
  );
}

export function WarumSESection() {
  return (
    <section style={{ background: '#F6F2EA', padding: '112px 0' }}>
      <div
        style={{
          ...container,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 60,
          alignItems: 'start',
        }}
      >
        {/* pinned intro — stays fixed while the reasons scroll past */}
        <div className="warum-sticky">
          <Reveal delay={0} style={{ ...kicker, marginBottom: 20 }}>
            Warum SE Handwerk
          </Reveal>
          <Reveal
            as="h2"
            delay={60}
            style={{ fontSize: 'clamp(28px,3.4vw,46px)', marginBottom: 26, color: '#1E2A35' }}
          >
            Verantwortung bis zur Abnahme.
          </Reveal>
          <Reveal delay={120} style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360 }}>
            <span style={{ width: 8, height: 12, borderLeft: '1px solid rgba(201,154,69,0.6)', flexShrink: 0 }} />
            <span style={{ flex: 1, height: 1, background: 'rgba(201,154,69,0.4)' }} />
            <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: '#C99A45', whiteSpace: 'nowrap' }}>
              4 GRÜNDE
            </span>
          </Reveal>
        </div>

        {/* the four reasons + result photo scroll past the pinned intro */}
        <div>
          {vorteile.map((v) => (
            <Reveal
              key={v.n}
              from="right"
              delay={v.delay}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr',
                gap: 16,
                padding: '34px 0',
                borderTop: '1px solid rgba(20,26,32,0.11)',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 12, color: '#C99A45' }}>{v.n}</span>
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
    </section>
  );
}

export function RegionSection() {
  return (
    <section style={{ background: '#EFE9DE', padding: '100px 0' }}>
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
            style={{ fontSize: 'clamp(28px,3.4vw,46px)', marginBottom: 24, color: '#1E2A35' }}
          >
            Im Raum Heilbronn und Umgebung.
          </Reveal>
          <Reveal as="p" delay={120} style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E', maxWidth: 460 }}>
            Wir arbeiten im gesamten Raum Heilbronn und Umgebung — von Neckarsulm über Sinsheim
            bis Stuttgart.
          </Reveal>
          <Reveal delay={180} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
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
            border: '1px solid rgba(20,26,32,0.11)',
            borderRadius: 6,
            background: '#F6F2EA',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(20,26,32,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,32,0.055) 1px,transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          {/* range rings */}
          {[
            { s: '82%', o: 0.1 },
            { s: '54%', o: 0.16 },
            { s: '28%', o: 0.24 },
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
                border: `1px solid rgba(201,154,69,${r.o})`,
                borderRadius: '50%',
              }}
            />
          ))}
          {/* fine rotating survey beam */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '82%',
              height: '82%',
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background:
                'conic-gradient(from 0deg, rgba(201,154,69,0.16), rgba(201,154,69,0.02) 14%, transparent 30%)',
              animation: 'radarSweep 7.5s linear infinite',
            }}
          />
          {/* one soft sonar pulse */}
          {[0, 1].map((i) => (
            <span
              key={i}
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '82%',
                height: '82%',
                border: '1px solid rgba(201,154,69,0.28)',
                borderRadius: '50%',
                animation: `sonar 4.6s ease-out ${(i * 2.3).toFixed(2)}s infinite`,
              }}
            />
          ))}
          {/* surrounding towns — placed by rough direction from Heilbronn */}
          {[
            { name: 'Neckarsulm', x: '57%', y: '31%' },
            { name: 'Sinsheim', x: '24%', y: '44%' },
            { name: 'Stuttgart', x: '52%', y: '77%' },
          ].map((c) => (
            <div
              key={c.name}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y,
                transform: 'translate(-50%,-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#74808B', flexShrink: 0 }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: '#6C7883', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
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
              width: 12,
              height: 12,
              background: '#C99A45',
              borderRadius: '50%',
              boxShadow: '0 0 0 6px rgba(201,154,69,0.16), 0 0 16px 2px rgba(201,154,69,0.55)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 'calc(50% + 15px)',
              top: 'calc(50% - 27px)',
              fontFamily: mono,
              fontSize: 11.5,
              fontWeight: 500,
              color: '#C99A45',
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
              color: '#74808B',
              letterSpacing: '0.05em',
            }}
          >
            49.14°N / 9.22°E — RADIUS ~60 KM
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function KontaktSection() {
  return (
    <section id="kontakt" style={{ background: '#F6F2EA', padding: '112px 0' }}>
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
            style={{ fontSize: 'clamp(30px,3.8vw,52px)', marginBottom: 24, color: '#1E2A35' }}
          >
            Sprechen wir über Ihr Projekt.
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            style={{ fontSize: 16.5, lineHeight: 1.7, color: '#47535E', maxWidth: 400, marginBottom: 40 }}
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
