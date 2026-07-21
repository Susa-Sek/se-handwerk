import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../lib/motion';
import { setLenis } from '../lib/smoothScroll';

gsap.registerPlugin(ScrollTrigger);

// Enables Lenis momentum scrolling and wires it to GSAP's ScrollTrigger so the
// pinned/scrubbed set-pieces stay in sync. Disabled entirely under
// prefers-reduced-motion (native scrolling, no smoothing, no pins).
export function useSmoothScroll(): void {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    setLenis(lenis);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // keep ScrollTrigger's cached positions in step with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    // drive Lenis from GSAP's ticker (single rAF loop for both)
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // recompute pin/scrub trigger positions once fonts + layout have settled
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
}
