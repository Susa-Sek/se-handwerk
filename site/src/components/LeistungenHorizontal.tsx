import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SectionKicker } from './sections';
import { leistungen } from '../content';

gsap.registerPlugin(ScrollTrigger);

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

// kie.ai trade photograph per position (dark low-key series)
const cardImages: Record<string, string> = {
  '01': 'leistung-komplett.jpg',
  '02': 'leistung-boden.jpg',
  '03': 'leistung-wand.jpg',
  '04': 'leistung-bad.jpg',
  '05': 'leistung-einzel.jpg',
};

// Leistungen as a horizontally-scrubbed, pinned set-piece: ink cards slide
// across the paper stage while a thin gold bar tracks scrub progress.
// Mobile / reduced motion: plain vertical stack (gsap.matchMedia guard).
export default function LeistungenHorizontal() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);

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
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.width = `${(self.progress * 100).toFixed(1)}%`;
          },
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
              <SectionKicker>Leistungsumfang</SectionKicker>
              <h2 style={{ fontSize: 'clamp(34px,5vw,68px)', color: 'var(--t-ink)' }}>Was wir übernehmen.</h2>
            </div>
            <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 10 }}>
              5 POSITIONEN
              <span className="lhz-hint" style={{ color: 'var(--gold-deep)' }}>→ scrollen</span>
            </span>
          </div>
          <div className="lhz-progress">
            <i ref={barRef} />
          </div>
        </div>

        <div ref={trackRef} className="lhz-track">
          {leistungen.map((l) => (
            <Link key={l.code} to={`/leistungen/${l.slug}`} className="lhz-card" aria-label={`${l.title} – mehr erfahren`}>
              <span
                aria-hidden
                className="card-img"
                style={{ backgroundImage: `url(/images/${cardImages[l.code]})` }}
              />
              <span className="lhz-num">{l.code}</span>
              <h3
                style={{
                  fontFamily: bricolage,
                  fontWeight: 700,
                  fontSize: 27,
                  letterSpacing: '-0.02em',
                  margin: '20px 0 14px',
                  color: '#F5F2EC',
                }}
              >
                {l.title}
              </h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'rgba(245,242,236,0.62)' }}>{l.desc}</p>
              <span style={{ marginTop: 'auto', paddingTop: 26, fontFamily: mono, fontSize: 10.5, color: 'rgba(224,168,60,0.9)', letterSpacing: '0.05em' }}>
                Mehr erfahren →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
