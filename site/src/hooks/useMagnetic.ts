import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

// Makes an element gently follow the cursor while hovered (magnetic CTA) and
// snap back on leave. No-op on touch devices and under reduced motion.
export function useMagnetic<T extends HTMLElement>(strength = 0.32) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transition = 'transform .15s ease-out';
      el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
    };
    const onLeave = () => {
      el.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1)';
      el.style.transform = 'translate(0,0)';
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength]);

  return ref;
}
