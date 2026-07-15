import { useEffect, useRef, useState } from 'react';
import { clamp, prefersReducedMotion } from '../lib/motion';

// Tracks how far an element has travelled through the viewport, as a value 0..1:
//   0  — the element's top edge is just entering from the bottom
//   0.5 — the element is centred in the viewport
//   1  — the element's bottom edge has just left the top
// Drives scroll-scrubbed effects (parallax drift, entrance scale) that continue
// to respond to scroll — unlike Reveal, which fires once. Uses the same
// rAF-throttled getBoundingClientRect signal as Reveal/Taktplan (deliberately
// not IntersectionObserver — see Reveal.tsx for why that fails in this layout).
export function useViewportProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0.5);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(0.5);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let last = -1;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = vh + r.height;
      const p = clamp((vh - r.top) / total, 0, 1);
      if (Math.abs(p - last) > 0.001) {
        last = p;
        setProgress(p);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return [ref, progress] as const;
}
