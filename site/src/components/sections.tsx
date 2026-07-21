import Reveal from './Reveal';
import ContactForm from './ContactForm';
import { useViewportProgress } from '../hooks/useViewportProgress';
import { useMagnetic } from '../hooks/useMagnetic';
import { useSectionLink } from '../hooks/useSectionLink';
import { clamp } from '../lib/motion';
import { ablauf, regionen, vorteile, zielgruppen } from '../content';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

const container: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 40px' };

// small mono kicker with a gold tick — shared section opener
export function SectionKicker({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <Reveal
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: mono,
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: dark ? 'rgba(245,242,236,0.5)' : 'var(--t-dim)',
        marginBottom: 20,
      }}
    >
      <span style={{ width: 34, height: 1, background: 'var(--gold)', flexShrink: 0 }} />
      {children}
    </Reveal>
  );
}

// ===== Blatt 1 — Statement (white): the problem as a scroll-driven word
// reveal; words ink up as you scroll, like text committing itself to paper.
const STATEMENT =
  'Der Bodenleger kommt, aber der Estrich ist noch feucht. Der Maler steht vor der Tür, während der Trockenbau noch läuft. Am Ende zieht sich ein Projekt, das acht Wochen dauern sollte, über ein halbes Jahr — und Sie sind der, der alles zusammenhalten muss.';

export function ProblemSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const words = STATEMENT.split(' ');
  const reveal = clamp((p - 0.18) / 0.42, 0, 1) * words.length;

  return (
    <section ref={ref} style={{ background: 'var(--paper)', padding: '150px 0 120px' }}>
      <div style={container}>
        <SectionKicker>Das Problem</SectionKicker>
        <h2
          style={{
            fontFamily: bricolage,
            fontWeight: 700,
            fontSize: 'clamp(24px,3.1vw,42px)',
            lineHeight: 1.32,
            letterSpacing: '-0.015em',
            maxWidth: 980,
          }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              style={{
                color: 'var(--t-ink)',
                opacity: i < reveal ? 1 : 0.13,
                transition: 'opacity .35s ease',
              }}
            >
              {w}{' '}
            </span>
          ))}
        </h2>
        <div className="g12" style={{ marginTop: 64 }}>
          <Reveal from="left" delay={80} className="c1-5">
            <p style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 'clamp(26px,3vw,40px)', lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--gold-deep)' }}>
              Genau da setzen wir an.
            </p>
          </Reveal>
          <Reveal from="right" delay={180} className="c7-13">
            <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--t-sub)', maxWidth: 560 }}>
              Wir planen den Ablauf, stimmen die Gewerke aufeinander ab, überwachen die Ausführung und
              stehen für das Ergebnis gerade. Sie haben eine Nummer, die Sie anrufen. Und einen Plan,
              der hält, was man realistisch halten kann.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// A gold timeline that draws across the four Takte as the section scrolls in.
function AblaufConnector({ count }: { count: number }) {
  const [ref, progress] = useViewportProgress<HTMLDivElement>();
  const fill = clamp((progress - 0.16) / 0.46, 0, 1);
  return (
    <div ref={ref} style={{ position: 'relative', height: 2, background: 'var(--line-ink)', marginBottom: 2 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${(fill * 100).toFixed(1)}%`,
          background: 'var(--gold)',
          boxShadow: '0 0 10px rgba(224,168,60,0.5)',
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
              background: lit ? 'var(--gold)' : '#C9C2B4',
              boxShadow: lit ? '0 0 9px 1px rgba(224,168,60,0.6)' : 'none',
              transition: 'background .3s ease, box-shadow .3s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// The four Takte hang from the timeline at increasing depth — a schedule, not
// four equal columns.
const taktDrops = [14, 58, 106, 154];

export function AblaufSection() {
  return (
    <section id="ablauf" style={{ background: 'var(--paper2)', padding: '120px 0 150px' }}>
      <div style={container}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 52,
          }}
        >
          <div>
            <SectionKicker>Ablauf in vier Takten</SectionKicker>
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(34px,5vw,68px)', color: 'var(--t-ink)' }}>
              So läuft es ab.
            </Reveal>
          </div>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: 'var(--t-dim)' }}>
            REALISTISCH GEPLANT — TRANSPARENT KOMMUNIZIERT
          </span>
        </div>
        <AblaufConnector count={ablauf.length} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 0 }}>
          {ablauf.map((a, i) => (
            <div key={a.num}>
              <span className="takt-drop" style={{ height: taktDrops[i] }} />
              <Reveal delay={a.delay} from={i % 2 === 0 ? 'up' : 'scale'} style={{ padding: '16px 26px 40px' }}>
                <div
                  style={{
                    fontFamily: bricolage,
                    fontWeight: 800,
                    fontSize: 64,
                    lineHeight: 1,
                    marginBottom: 20,
                    letterSpacing: '-0.03em',
                    color: 'transparent',
                    WebkitTextStroke: '1.4px var(--gold-deep)',
                  }}
                >
                  {a.num}
                </div>
                <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 21, color: 'var(--t-ink)', marginBottom: 14, letterSpacing: '-0.015em' }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--t-sub)' }}>{a.desc}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== Eigentümer — bento grid, mixed ink/white tiles (schwarz auf weiss in
// miniature). Investors get the big ink tile; a stat tile completes the set.
export function EigentuemerSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();

  const badge = (code: string, onInk: boolean) => (
    <div
      style={{
        fontFamily: mono,
        fontSize: 11,
        color: '#0D0E10',
        background: 'var(--gold)',
        width: 26,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        marginBottom: 22,
        boxShadow: onInk ? '0 0 14px rgba(224,168,60,0.35)' : 'none',
      }}
    >
      {code}
    </div>
  );

  return (
    <section ref={ref} id="eigentuemer" style={{ background: 'var(--paper)', padding: '130px 0' }}>
      <div style={container}>
        <div style={{ maxWidth: 760, marginBottom: 60 }}>
          <SectionKicker>Für wen wir arbeiten</SectionKicker>
          <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(34px,5vw,68px)', color: 'var(--t-ink)' }}>
            Für Eigentümer, die keine Zeit für Baustellen haben.
          </Reveal>
        </div>
        <div className="bento">
          <div className="bento-a" style={{ transform: `translateY(${((p - 0.5) * 12).toFixed(1)}px)` }}>
            <Reveal from="scale" delay={0} className="tile tile-ink grain">
              <span aria-hidden className="card-img" style={{ backgroundImage: 'url(/images/bento-invest.jpg)' }} />
              {badge(zielgruppen[0].code, true)}
              <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 'clamp(24px,2.4vw,32px)', lineHeight: 1.15, marginBottom: 18, letterSpacing: '-0.02em', color: '#F5F2EC' }}>
                {zielgruppen[0].title}
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(245,242,236,0.68)', maxWidth: 520 }}>{zielgruppen[0].desc}</p>
            </Reveal>
          </div>
          <div className="bento-b" style={{ transform: `translateY(${((p - 0.5) * -16).toFixed(1)}px)` }}>
            <Reveal from="up" delay={90} className="tile tile-white">
              {badge(zielgruppen[1].code, false)}
              <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 21, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.015em', color: 'var(--t-ink)' }}>
                {zielgruppen[1].title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--t-sub)' }}>{zielgruppen[1].desc}</p>
            </Reveal>
          </div>
          <div className="bento-c" style={{ transform: `translateY(${((p - 0.5) * 18).toFixed(1)}px)` }}>
            <Reveal from="up" delay={160} className="tile tile-white">
              {badge(zielgruppen[2].code, false)}
              <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 21, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.015em', color: 'var(--t-ink)' }}>
                {zielgruppen[2].title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--t-sub)' }}>{zielgruppen[2].desc}</p>
            </Reveal>
          </div>
          <div className="bento-stat" style={{ transform: `translateY(${((p - 0.5) * -10).toFixed(1)}px)` }}>
            <Reveal from="scale" delay={230} className="tile tile-ink grain" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 'clamp(44px,4.6vw,72px)', lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--gold)' }}>
                &lt;&thinsp;24h
              </span>
              <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.08em', lineHeight: 1.9, color: 'rgba(245,242,236,0.6)' }}>
                RÜCKMELDUNG AUF JEDE ANFRAGE
                <br />
                MEIST NOCH AM SELBEN TAG
              </span>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WarumSESection() {
  return (
    <section style={{ background: 'var(--paper2)', padding: '132px 0 110px' }}>
      <div style={container}>
        <div className="g12">
          {/* pinned intro — stays fixed while the reasons scroll past */}
          <div className="c1-5 warum-sticky">
            <SectionKicker>Warum SE Handwerk</SectionKicker>
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(32px,4vw,56px)', marginBottom: 26, color: 'var(--t-ink)' }}>
              Verantwortung bis zur Abnahme.
            </Reveal>
            <Reveal delay={120} style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 360 }}>
              <span style={{ width: 8, height: 12, borderLeft: '1px solid rgba(224,168,60,0.7)', flexShrink: 0 }} />
              <span style={{ flex: 1, height: 1, background: 'rgba(224,168,60,0.5)' }} />
              <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.06em', color: 'var(--gold-deep)', whiteSpace: 'nowrap' }}>
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
                className="grund-row"
                style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: 18, padding: '34px 0' }}
              >
                <span
                  style={{
                    fontFamily: bricolage,
                    fontWeight: 800,
                    fontSize: 30,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: 'transparent',
                    WebkitTextStroke: '1.1px var(--gold-deep)',
                  }}
                >
                  {v.n}
                </span>
                <div>
                  <h3 style={{ fontFamily: bricolage, fontWeight: 700, fontSize: 20, color: 'var(--t-ink)', marginBottom: 6, letterSpacing: '-0.015em' }}>
                    {v.title}
                  </h3>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--t-sub)' }}>{v.desc}</p>
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
  const textDrift = ((p - 0.5) * 20).toFixed(1);
  const mapDrift = ((p - 0.5) * -26).toFixed(1);

  return (
    <section ref={ref} style={{ background: 'var(--paper)', padding: '136px 0 120px' }}>
      <div style={container}>
        <div className="g12" style={{ alignItems: 'center' }}>
          <div className="c1-5" style={{ transform: `translateY(${textDrift}px)`, willChange: 'transform' }}>
            <SectionKicker>Einsatzgebiet</SectionKicker>
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(32px,4vw,56px)', marginBottom: 24, color: 'var(--t-ink)', maxWidth: '11ch' }}>
              Im Raum Heilbronn und Umgebung.
            </Reveal>
            <Reveal as="p" delay={110} style={{ fontSize: 16.5, lineHeight: 1.7, color: 'var(--t-sub)', maxWidth: 400 }}>
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
                    color: 'var(--t-sub)',
                    border: '1px solid var(--line-ink)',
                    padding: '8px 14px',
                    borderRadius: 100,
                    background: 'var(--white)',
                  }}
                >
                  {r}
                </span>
              ))}
            </Reveal>
          </div>

          <div className="c6-12" style={{ transform: `translateY(${mapDrift}px)`, willChange: 'transform' }}>
            <Reveal from="scale" delay={120} className="region-map">
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(rgba(20,23,26,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,23,26,0.05) 1px,transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />
              {[
                { s: '84%', c: 'rgba(20,23,26,0.12)' },
                { s: '54%', c: 'rgba(224,168,60,0.65)' },
                { s: '26%', c: 'rgba(20,23,26,0.16)' },
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
              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {regionCities.map((c) => (
                  <line key={c.name} x1="50" y1="50" x2={c.x} y2={c.y} stroke="rgba(169,122,31,0.65)" strokeWidth="0.32" strokeDasharray="1.3 1.3" />
                ))}
              </svg>
              {regionCities.map((c) => (
                <div
                  key={c.name}
                  style={{ position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--t-ink)', flexShrink: 0 }} />
                  <span style={{ fontFamily: mono, fontSize: 10.5, color: 'var(--t-sub)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{c.name}</span>
                </div>
              ))}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 13,
                  height: 13,
                  background: 'var(--gold)',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 5px rgba(224,168,60,0.18), 0 0 18px 3px rgba(224,168,60,0.55)',
                }}
              />
              <div style={{ position: 'absolute', left: 'calc(50% + 16px)', top: 'calc(50% - 28px)', fontFamily: mono, fontSize: 12, fontWeight: 600, color: 'var(--gold-deep)', letterSpacing: '0.05em' }}>
                HEILBRONN
              </div>
              <div style={{ position: 'absolute', bottom: 16, left: 16, fontFamily: mono, fontSize: 10.5, color: 'var(--t-dim)', letterSpacing: '0.05em' }}>
                49.14°N / 9.22°E — RADIUS ~60 KM
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== dark CTA band — the dramatic peak before the form
export function CtaBand() {
  const onSection = useSectionLink();
  const cta = useMagnetic<HTMLAnchorElement>();
  return (
    <section className="grain" style={{ background: 'var(--ink)', padding: '130px 0', color: '#F5F2EC' }}>
      <div style={{ ...container, textAlign: 'center' }}>
        <Reveal as="h2" style={{ fontSize: 'clamp(38px,6.4vw,96px)', letterSpacing: '-0.035em', lineHeight: 1.02 }}>
          Wir übernehmen
          <br />
          <span style={{ color: 'var(--gold)' }}>das</span>.
        </Reveal>
        <Reveal delay={140} style={{ marginTop: 44 }}>
          <a
            ref={cta}
            href="/#kontakt"
            onClick={onSection('#kontakt')}
            className="btn-primary magnetic"
            style={{
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '19px 38px',
              borderRadius: 100,
              display: 'inline-block',
            }}
          >
            Projekt besprechen
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function KontaktSection() {
  const [ref, p] = useViewportProgress<HTMLElement>();
  const textDrift = ((p - 0.5) * 14).toFixed(1);
  const formDrift = ((p - 0.5) * -10).toFixed(1);

  return (
    <section ref={ref} id="kontakt" style={{ background: 'var(--paper)', padding: '124px 0 140px' }}>
      <div style={container}>
        <div className="g12">
          <div className="c1-5" style={{ transform: `translateY(${textDrift}px)`, willChange: 'transform' }}>
            <SectionKicker>Kontakt</SectionKicker>
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(32px,4vw,56px)', marginBottom: 24, color: 'var(--t-ink)' }}>
              Sprechen wir über Ihr Projekt.
            </Reveal>
            <Reveal as="p" delay={110} style={{ fontSize: 16.5, lineHeight: 1.7, color: 'var(--t-sub)', maxWidth: 400, marginBottom: 40 }}>
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
                  borderTop: '1px solid var(--line-ink)',
                  borderBottom: '1px solid var(--line-ink)',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)', letterSpacing: '0.06em' }}>EINSATZGEBIET</span>
                <span style={{ fontFamily: mono, fontSize: 14, color: 'var(--t-sub)' }}>Raum Heilbronn und Umgebung</span>
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

function ContactRow({ label, value, href, top }: { label: string; value: string; href: string; top?: boolean }) {
  return (
    <a
      href={href}
      className="contact-line"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderTop: top ? '1px solid var(--line-ink)' : undefined,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontFamily: mono, fontSize: 15 }}>{value}</span>
    </a>
  );
}
