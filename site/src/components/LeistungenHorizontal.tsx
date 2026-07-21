import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Register } from './sections';
import { leistungen } from '../content';

gsap.registerPlugin(ScrollTrigger);

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

// Leistungen as a horizontally-scrubbed, pinned set-piece: the section pins and
// the five service cards slide sideways as you scroll (GSAP ScrollTrigger).
// Desktop + no-reduced-motion only — on mobile / reduced motion gsap.matchMedia
// never builds the tween and CSS lays the cards out as a normal vertical stack.
export default function LeistungenHorizontal() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const amount = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -amount(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + amount(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} id="leistungen" className="lhz">
      <div className="lhz-inner">
        <div className="lhz-head">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <Register n={2} label="Leistungsumfang" />
              <h2 style={{ fontSize: 'clamp(32px,4.6vw,62px)', color: '#1E2A35' }}>Was wir übernehmen.</h2>
            </div>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#6C7883', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 10 }}>
              5 POSITIONEN
              <span className="lhz-hint" style={{ color: '#C99A45' }}>→ scrollen</span>
            </span>
          </div>
        </div>

        <div ref={trackRef} className="lhz-track">
          {leistungen.map((l) => (
            <article key={l.code} className="lhz-card">
              <span style={{ fontFamily: mono, fontSize: 13, color: '#C99A45', letterSpacing: '0.06em' }}>{l.code}</span>
              <h3
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 27,
                  color: '#1E2A35',
                  letterSpacing: '-0.02em',
                  margin: '18px 0 14px',
                }}
              >
                {l.title}
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: '#525E69' }}>{l.desc}</p>
              <span style={{ marginTop: 'auto', paddingTop: 24, fontFamily: mono, fontSize: 10.5, color: '#8A929B', letterSpacing: '0.05em' }}>
                {l.code} / 05
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
