import { useEffect, useRef } from 'react';
import { useSectionLink } from '../hooks/useSectionLink';
import { useMagnetic } from '../hooks/useMagnetic';
import { prefersReducedMotion } from '../lib/motion';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

const ctaBase: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '17px 30px',
  borderRadius: 100,
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

const statNum: React.CSSProperties = {
  fontFamily: bricolage,
  fontWeight: 800,
  fontSize: 34,
  color: '#F5F2EC',
  lineHeight: 1,
};
const statLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  color: 'rgba(245,242,236,0.5)',
  letterSpacing: '0.04em',
  marginTop: 6,
  lineHeight: 1.5,
};

// mini floating Taktplan card rows (deepest parallax layer)
const miniRows = [
  { label: 'RÜCKBAU', left: '0', width: '40%', color: '#3A4046', delay: 1.35 },
  { label: 'TROCKENB.', left: '32%', width: '34%', color: '#3A4046', delay: 1.47 },
  { label: 'BODEN', left: '60%', width: '22%', color: '#E0A83C', delay: 1.59 },
  { label: 'MALER', left: '80%', width: '20%', color: '#E0A83C', delay: 1.71 },
];

// headline lines revealed from a clip mask, one after another; the promise
// line lands last, in gold
const HEAD_LINES: { text: string; gold?: boolean; delay: number }[] = [
  { text: 'Ihre Immobilie.', delay: 0.18 },
  { text: 'Komplett saniert.', delay: 0.32 },
  { text: 'Zum Festpreis.', gold: true, delay: 0.46 },
];

// corner survey crosshair with a coordinate readout
function Crosshair({ pos, label, delay }: { pos: React.CSSProperties; label: string; delay: number }) {
  return (
    <div style={{ position: 'absolute', ...pos, pointerEvents: 'none' }}>
      <div style={{ position: 'relative', width: 26, height: 26, animation: `dot .5s ease ${delay}s both` }}>
        <span style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, background: 'rgba(224,168,60,0.5)' }} />
        <span style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: 1, background: 'rgba(224,168,60,0.5)' }} />
      </div>
      <span
        style={{
          position: 'absolute',
          top: 30,
          left: 0,
          whiteSpace: 'nowrap',
          fontFamily: mono,
          fontSize: 9.5,
          letterSpacing: '0.05em',
          color: 'rgba(245,242,236,0.35)',
          animation: `dot .5s ease ${delay + 0.15}s both`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function Hero() {
  const onSection = useSectionLink();
  const rootRef = useRef<HTMLElement | null>(null);
  const ctaPrimary = useMagnetic<HTMLAnchorElement>();
  const ctaGhost = useMagnetic<HTMLAnchorElement>(0.22);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let tx = 0.5;
    let ty = 0.4;
    let px = 0;
    let py = 0;

    const apply = () => {
      raf = 0;
      root.style.setProperty('--px', px.toFixed(3));
      root.style.setProperty('--py', py.toFixed(3));
      root.style.setProperty('--gx', (tx * 100).toFixed(1) + '%');
      root.style.setProperty('--gy', (ty * 100).toFixed(1) + '%');
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      tx = x;
      ty = y;
      px = (x - 0.5) * 2;
      py = (y - 0.5) * 2;
      schedule();
    };
    const onLeave = () => {
      tx = 0.5;
      ty = 0.4;
      px = 0;
      py = 0;
      schedule();
    };
    const onScroll = () => {
      const h = root.offsetHeight || 1;
      const sp = Math.max(0, Math.min(1, window.scrollY / h));
      root.style.setProperty('--sp', sp.toFixed(3));
      root.style.setProperty('--heroFade', (1 - Math.min(1, sp * 1.4)).toFixed(3));
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="hero-root grain"
      style={{
        position: 'relative',
        minHeight: 'min(980px, 100svh)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '150px 0 90px',
        background: 'radial-gradient(130% 100% at 78% 0%, #17191D 0%, #0D0E10 52%, #0A0B0C 100%)',
        color: '#F5F2EC',
      }}
    >
      {/* blueprint grid (parallax back layer) */}
      <div
        aria-hidden
        className="hero-depth"
        style={{
          position: 'absolute',
          inset: '-4%',
          transform:
            'translate3d(calc(var(--px) * -14px), calc(var(--py) * -14px), 0) translateY(calc(var(--sp,0) * -60px))',
          maskImage: 'radial-gradient(120% 90% at 60% 30%, #000 40%, transparent 92%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 60% 30%, #000 40%, transparent 92%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(245,242,236,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,242,236,0.03) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(224,168,60,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(224,168,60,0.06) 1px,transparent 1px)',
            backgroundSize: '220px 220px',
          }}
        />
      </div>

      {/* cursor-follow survey light */}
      <div aria-hidden className="hero-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px', position: 'relative', width: '100%' }}>
        {/* corner crosshairs + coordinates (mid parallax) */}
        <div
          aria-hidden
          className="hero-depth hero-corners"
          style={{
            position: 'absolute',
            inset: '-62px 40px auto',
            transform: 'translate3d(calc(var(--px) * 22px), calc(var(--py) * 22px), 0)',
          }}
        >
          <Crosshair pos={{ top: 0, left: -10 }} label="49.14°N / 9.22°E" delay={1.6} />
          <Crosshair pos={{ top: 0, right: -10 }} label="BLATT 01 / 01" delay={1.72} />
        </div>

        {/* content (front layer, gentle counter-parallax + scroll fade) */}
        <div
          className="hero-depth"
          style={{
            position: 'relative',
            transform: 'translate3d(calc(var(--px) * 6px), calc(var(--py) * 6px), 0)',
            opacity: 'calc(1 - var(--sp,0) * 0.85)',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(46px,8.6vw,132px)',
              letterSpacing: '-0.04em',
              lineHeight: 0.96,
              margin: 0,
            }}
          >
            {HEAD_LINES.map((l) => (
              <span key={l.text} className="hline">
                <span style={{ animationDelay: `${l.delay}s`, color: l.gold ? '#E0A83C' : undefined }}>
                  {l.text}
                </span>
              </span>
            ))}
          </h1>

          {/* architectural dimension line annotating the headline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 30,
              maxWidth: 560,
              animation: 'fadeUp .8s ease 1s both',
            }}
          >
            <span style={{ width: 8, height: 12, borderLeft: '1px solid rgba(224,168,60,0.7)', flexShrink: 0 }} />
            <span
              style={{
                flex: 1,
                height: 1,
                background: 'rgba(224,168,60,0.5)',
                transformOrigin: 'left',
                animation: 'growX .9s cubic-bezier(.16,1,.3,1) 1.1s both',
              }}
            />
            <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', color: '#E0A83C', whiteSpace: 'nowrap' }}>
              SCHWARZ AUF WEISS — SCHRIFTLICH
            </span>
            <span
              style={{
                flex: 1,
                height: 1,
                background: 'rgba(224,168,60,0.5)',
                transformOrigin: 'right',
                animation: 'growX .9s cubic-bezier(.16,1,.3,1) 1.1s both',
              }}
            />
            <span style={{ width: 8, height: 12, borderRight: '1px solid rgba(224,168,60,0.7)', flexShrink: 0 }} />
          </div>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.65,
              color: 'rgba(245,242,236,0.66)',
              maxWidth: 480,
              marginTop: 28,
              animation: 'fadeUp .8s ease 1.15s both',
            }}
          >
            Ein Ansprechpartner übernimmt Ihre Sanierung vollständig — von der Aufnahme bis zur
            bezugsfertigen Übergabe. Verbindlicher Festpreis vor Baubeginn. Danach ist Ihr Objekt
            vermietbar oder verkaufsfertig. Den Rest machen wir.
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', animation: 'fadeUp .8s ease 1.3s both' }}>
            <a
              ref={ctaPrimary}
              href="/#kontakt"
              onClick={onSection('#kontakt')}
              className="btn-primary magnetic"
              style={ctaBase}
            >
              Projekt besprechen
            </a>
            <a
              ref={ctaGhost}
              href="/#leistungen"
              onClick={onSection('#leistungen')}
              className="btn-ghost magnetic"
              style={ctaBase}
            >
              Unsere Leistungen
            </a>
          </div>

          <div style={{ display: 'flex', gap: 40, marginTop: 52, flexWrap: 'wrap', animation: 'fadeUp .8s ease 1.45s both' }}>
            <div>
              <div style={statNum}>1</div>
              <div style={statLabel}>ANSPRECH&shy;PARTNER</div>
            </div>
            <div>
              <div style={statNum}>&lt;&nbsp;24h</div>
              <div style={statLabel}>RÜCK&shy;MELDUNG</div>
            </div>
            <div>
              <div style={statNum}>100%</div>
              <div style={statLabel}>AUS EINER HAND</div>
            </div>
          </div>
        </div>

        {/* floating Taktplan mini-card (deepest parallax, idle float) */}
        <div
          aria-hidden
          className="hero-depth"
          style={{
            position: 'absolute',
            right: 40,
            bottom: -40,
            width: 'clamp(260px, 30vw, 340px)',
            transform: 'translate3d(calc(var(--px) * 34px), calc(var(--py) * 34px), 0)',
            animation: 'floatIn 1s cubic-bezier(.16,1,.3,1) 1.1s both',
          }}
        >
          <div style={{ animation: 'floatY 7s ease-in-out 2.2s infinite' }}>
            <div
              style={{
                background: 'rgba(21,23,26,0.85)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(224,168,60,0.22)',
                borderRadius: 10,
                padding: '16px 16px 18px',
                boxShadow: '0 30px 60px -24px rgba(0,0,0,0.7)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(245,242,236,0.08)',
                  paddingBottom: 11,
                  marginBottom: 14,
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: '0.06em', color: 'rgba(245,242,236,0.5)' }}>
                  TAKTPLAN #4471
                </span>
                <span style={{ fontFamily: mono, fontSize: 10, color: '#E0A83C', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0A83C', boxShadow: '0 0 8px 1px rgba(224,168,60,0.7)' }} />
                  IM TAKT
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {miniRows.map((r) => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontFamily: mono, fontSize: 9, color: 'rgba(245,242,236,0.45)', width: 62, flexShrink: 0 }}>
                      {r.label}
                    </span>
                    <span style={{ height: 12, flex: 1, position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: r.left,
                          width: r.width,
                          height: '100%',
                          background: r.color,
                          borderRadius: 2,
                          transformOrigin: 'left',
                          animation: `drawX .55s cubic-bezier(.16,1,.3,1) ${r.delay}s both`,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          opacity: 'var(--heroFade,1)',
          animation: 'fadeUp 1s ease 1.8s both',
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,242,236,0.4)' }}>SCROLLEN</span>
        <span
          style={{
            width: 1,
            height: 34,
            background: 'linear-gradient(#E0A83C,transparent)',
            transformOrigin: 'top',
            animation: 'tick 1.4s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  );
}
