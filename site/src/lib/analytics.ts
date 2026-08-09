declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Fires a GA4 event via the gtag() loaded in index.html. No-ops silently if
// gtag hasn't loaded yet (e.g. ad blockers, or before the script tag runs).
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}
