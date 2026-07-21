import { useEffect, useState } from 'react';
import { useSectionLink } from '../hooks/useSectionLink';
import { useMagnetic } from '../hooks/useMagnetic';
import { useViewportProgress } from '../hooks/useViewportProgress';
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
  fontSize: 32,
  color: '#F5F2EC',
  lineHeight: 1,
};
const statLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10.5,
  color: 'rgba(245,242,236,0.5)',
  letterSpacing: '0.04em',
  marginTop: 6,
  lineHeight: 1.5,
};

// outcome words rotate in gold — a promise about the result, not a date
const OUTCOMES = ['vermietbar.', 'verkaufsfertig.', 'bezugsfertig.'];

export default function Hero() {
  const onSection = useSectionLink();
  const [ref, p] = useViewportProgress<HTMLElement>();
  const ctaPrimary = useMagnetic<HTMLAnchorElement>();
  const ctaGhost = useMagnetic<HTMLAnchorElement>(0.22);
  const [wi, setWi] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setWi((v) => (v + 1) % OUTCOMES.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  // slow ken-burns on the photo, tied to scroll
  const photoScale = 1.04 + p * 0.06;
  const photoShift = (p * -34).toFixed(1);

  return (
    <section
      ref={ref}
      id="top"
      className="hero-split grain"
      style={{ background: 'var(--ink)', color: '#F5F2EC' }}
    >
      {/* right: full-bleed result photo, bleeding into the ink on the left */}
      <div className="hero-photo" aria-hidden>
        <div
          style={{
            position: 'absolute',
            inset: '-6% 0',
            backgroundImage: 'url(/images/nachher.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${photoScale.toFixed(3)}) translateY(${photoShift}px)`,
            willChange: 'transform',
          }}
        />
        <div className="hero-photo-fade" />
        <span
          style={{
            position: 'absolute',
            bottom: 22,
            right: 24,
            fontFamily: mono,
            fontSize: 10.5,
            letterSpacing: '0.08em',
            color: 'rgba(245,242,236,0.7)',
            background: 'rgba(13,14,16,0.5)',
            border: '1px solid rgba(245,242,236,0.16)',
            padding: '7px 12px',
            borderRadius: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          OBJEKT RAUM HEILBRONN — NACH ÜBERGABE
        </span>
      </div>

      {/* left: content */}
      <div className="hero-copy">
        {/* faint blueprint grid behind the type */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(245,242,236,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(245,242,236,0.03) 1px,transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(120% 90% at 20% 30%, #000 30%, transparent 88%)',
            WebkitMaskImage: 'radial-gradient(120% 90% at 20% 30%, #000 30%, transparent 88%)',
            pointerEvents: 'none',
          }}
        />
        <div className="hero-copy-inner">
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 26, animation: 'fadeUp .8s ease .1s both' }}>
            SANIERUNG AUS EINER HAND — RAUM HEILBRONN
          </div>

          <h1 style={{ fontSize: 'clamp(44px,6.4vw,96px)', letterSpacing: '-0.035em', lineHeight: 0.98, margin: 0 }}>
            <span className="hline">
              <span style={{ animationDelay: '.18s' }}>Ihre Immobilie,</span>
            </span>
            <span className="hline" style={{ color: 'var(--gold)' }}>
              {prefersReducedMotion() ? (
                <span>{OUTCOMES[0]}</span>
              ) : (
                <span key={wi} style={{ animationDelay: '0s' }}>
                  {OUTCOMES[wi]}
                </span>
              )}
            </span>
          </h1>

          <p style={{ fontSize: 17.5, lineHeight: 1.65, color: 'rgba(245,242,236,0.66)', maxWidth: 480, marginTop: 30, animation: 'fadeUp .8s ease 1s both' }}>
            Ein Ansprechpartner koordiniert alle Gewerke — von der ersten Begehung bis zur Übergabe.
            Mit Festpreis-Angebot und einem Taktplan, der realistisch geplant ist. Verschiebt sich
            etwas, erfahren Sie es zuerst von uns.
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 34, flexWrap: 'wrap', animation: 'fadeUp .8s ease 1.15s both' }}>
            <a ref={ctaPrimary} href="/#kontakt" onClick={onSection('#kontakt')} className="btn-primary magnetic" style={ctaBase}>
              Projekt besprechen
            </a>
            <a ref={ctaGhost} href="/#leistungen" onClick={onSection('#leistungen')} className="btn-ghost magnetic" style={ctaBase}>
              Unsere Leistungen
            </a>
          </div>

          <div style={{ display: 'flex', gap: 38, marginTop: 50, flexWrap: 'wrap', animation: 'fadeUp .8s ease 1.3s both' }}>
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
      </div>

      {/* scroll hint */}
      <div
        aria-hidden
        className="hero-scroll"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeUp 1s ease 1.7s both' }}
      >
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(245,242,236,0.4)' }}>SCROLLEN</span>
        <span style={{ width: 1, height: 34, background: 'linear-gradient(#E0A83C,transparent)', transformOrigin: 'top', animation: 'tick 1.4s ease-in-out infinite' }} />
      </div>
    </section>
  );
}
