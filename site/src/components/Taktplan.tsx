import { useScroll } from '../context/ScrollContext';
import { clamp, lerp, mixHex, smoothstep } from '../lib/motion';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

const TOTAL = 66;
const ROW_H = 54;
const BAR_H = 30;
const TOP_PAD = 6;

interface BarDef {
  code: string;
  name: string;
  c: [number, number];
  o: [number, number];
  tag?: string;
}

const defs: BarDef[] = [
  { code: '01', name: 'Rückbau', c: [4, 15], o: [0, 9] },
  { code: '02', name: 'Bodenarbeiten', c: [8, 22], o: [18, 10], tag: 'KONFLIKT · ESTRICH FEUCHT' },
  { code: '03', name: 'Trockenbau', c: [3, 24], o: [8, 11] },
  { code: '04', name: 'Bad & Sanitär', c: [22, 28], o: [26, 12] },
  { code: '05', name: 'Malerarbeiten', c: [32, 30], o: [36, 8], tag: '+18 TAGE' },
];

const PLOT_HEIGHT = TOP_PAD * 2 + defs.length * ROW_H;

export default function Taktplan() {
  const { taktProgress, reduced } = useScroll();
  const p = taktProgress;
  const e = smoothstep(p);
  const colorT = smoothstep(clamp((p - 0.42) / 0.5, 0, 1));

  const bars = defs.map((d, i) => {
    const start = lerp(d.c[0], d.o[0], e);
    const len = lerp(d.c[1], d.o[1], e);
    const jitter = (1 - e) * (i % 2 === 0 ? -5 : 6);
    const left = (start / TOTAL) * 100;
    const width = (len / TOTAL) * 100;
    const top = TOP_PAD + i * ROW_H + jitter;
    const bg = mixHex('#3A4046', '#E0A83C', colorT);
    const hasTag = !!d.tag && 1 - e > 0.04;
    return { ...d, left, width, top, bg, hasTag, tagOpacity: 1 - e };
  });

  const deadlineLeft = (45 / TOTAL) * 100;
  const playheadLeft = (lerp(1, 45, e) / TOTAL) * 100;
  const playheadOpacity = clamp((p - 0.12) / 0.18, 0, 1);
  const chaosOpacity = 1 - clamp(e * 1.7, 0, 1);
  const orderOpacity = clamp((e - 0.45) / 0.4, 0, 1);

  return (
    <section
      id="takt-sec"
      className="grain"
      style={{
        position: 'relative',
        height: reduced ? '100vh' : '280vh',
        background: '#0D0E10',
        color: '#F5F2EC',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: 34,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,242,236,0.55)',
                  marginBottom: 14,
                }}
              >
                Das eine Kapitel — ein Ablauf in der Zeit
              </div>
              <div style={{ position: 'relative', height: 52 }}>
                <h2
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: bricolage,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    fontSize: 'clamp(26px,3.2vw,44px)',
                    color: 'rgba(245,242,236,0.55)',
                    opacity: chaosOpacity,
                  }}
                >
                  Ohne Koordination.
                </h2>
                <h2
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: bricolage,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    fontSize: 'clamp(26px,3.2vw,44px)',
                    color: '#F5F2EC',
                    opacity: orderOpacity,
                  }}
                >
                  Mit SE&nbsp;Handwerk.
                </h2>
              </div>
            </div>
            <div
              style={{
                textAlign: 'right',
                fontFamily: mono,
                fontSize: 11,
                color: 'rgba(245,242,236,0.55)',
                letterSpacing: '0.05em',
                lineHeight: 1.9,
              }}
            >
              5 GEWERKE
              <br />
              1 ANSPRECHPARTNER
              <br />
              1 TERMIN
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: mono,
              fontSize: 10.5,
              color: 'rgba(245,242,236,0.38)',
              letterSpacing: '0.05em',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(245,242,236,0.12)',
            }}
          >
            <span>TAG 0</span>
            <span>15</span>
            <span>30</span>
            <span>45</span>
            <span>60</span>
          </div>

          <div style={{ position: 'relative', marginTop: 14, height: PLOT_HEIGHT }}>
            <div
              style={{
                position: 'absolute',
                top: -8,
                bottom: 0,
                width: 1,
                background:
                  'repeating-linear-gradient(#E0A83C,#E0A83C 4px,transparent 4px,transparent 8px)',
                left: `${deadlineLeft.toFixed(2)}%`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -8,
                bottom: 0,
                width: 2,
                background: '#F5F2EC',
                boxShadow: '0 0 8px rgba(245,242,236,0.4)',
                left: `${playheadLeft.toFixed(2)}%`,
                opacity: playheadOpacity,
              }}
            />
            {bars.map((bar) => (
              <div
                key={bar.code}
                style={{
                  position: 'absolute',
                  left: `${bar.left.toFixed(2)}%`,
                  width: `${bar.width.toFixed(2)}%`,
                  top: `${bar.top.toFixed(1)}px`,
                  height: BAR_H,
                  background: bar.bg,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  boxShadow: '0 1px 0 rgba(0,0,0,.35)',
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {bar.code} · {bar.name}
                </span>
                {bar.hasTag && (
                  <span
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: '50%',
                      transform: 'translate(100%,-50%)',
                      fontFamily: mono,
                      fontSize: 10,
                      color: '#E0895A',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      opacity: bar.tagOpacity,
                    }}
                  >
                    ◄ {bar.tag}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 38,
              borderTop: '1px solid rgba(245,242,236,0.12)',
              paddingTop: 20,
              maxWidth: 580,
            }}
          >
            <p
              style={{
                fontFamily: bricolage,
                fontWeight: 600,
                fontSize: 20,
                lineHeight: 1.4,
                color: '#F5F2EC',
                letterSpacing: '-0.01em',
              }}
            >
              Ein Ablauf. Ein Ansprechpartner. Ein realistischer Taktplan.
            </p>
            <p
              style={{
                fontFamily: mono,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: 'rgba(245,242,236,0.55)',
                letterSpacing: '0.02em',
                marginTop: 12,
              }}
            >
              Den Taktplan bekommen Sie vor Baubeginn — und wenn sich etwas verschiebt, erfahren Sie es zuerst von uns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
