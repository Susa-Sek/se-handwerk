import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const mono = "'IBM Plex Mono',monospace";
const bricolage = "'Bricolage Grotesque',sans-serif";

// Short brand moment (<1.2s): a surveyor's counter runs 0→100 % with a gold
// bar, then the ink curtain lifts. Shown once per session; skipped under
// reduced motion.
export default function Preloader() {
  const [skip] = useState(
    () => prefersReducedMotion() || sessionStorage.getItem('se-preloaded') === '1',
  );
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (skip) return;
    sessionStorage.setItem('se-preloaded', '1');
    const t0 = performance.now();
    const DUR = 950;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setDone(true);
        window.setTimeout(() => setGone(true), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [skip]);

  if (skip || gone) return null;

  return (
    <div className={`preloader${done ? ' done' : ''}`} aria-hidden>
      <div>
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(245,242,236,0.5)', marginBottom: 10 }}>
          SE HANDWERK — AUFMASS LÄUFT
        </div>
        <div style={{ fontFamily: bricolage, fontWeight: 800, fontSize: 'clamp(64px,12vw,150px)', lineHeight: 0.9, color: '#F5F2EC', letterSpacing: '-0.04em' }}>
          {pct}
          <span style={{ color: '#E0A83C' }}>%</span>
        </div>
      </div>
      <div className="preloader-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
