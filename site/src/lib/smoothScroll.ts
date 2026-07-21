import type Lenis from 'lenis';

// Module-level handle to the active Lenis instance so anchor navigation
// (useSectionLink, ScrollManager) can scroll through Lenis instead of jumping
// natively. Null when smooth scroll is off (reduced motion / before mount).
let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null): void {
  lenis = l;
}

export function getLenis(): Lenis | null {
  return lenis;
}

// Smoothly scroll a section into view, accounting for the fixed nav height.
export function scrollToId(id: string): void {
  const el = document.getElementById(id);
  if (!el) {
    scrollToTop();
    return;
  }
  if (lenis) lenis.scrollTo(el, { offset: -70 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
