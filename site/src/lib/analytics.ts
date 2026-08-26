import { getConsent } from './consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

// Feuert ein GA4-Event über das in index.html definierte gtag(). Sendet nur,
// wenn der Nutzer eingewilligt hat (getConsent() === 'granted') und gtag
// verfügbar ist. Ohne Einwilligung passiert nichts – kein Datenabfluss.
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return
  if (getConsent() !== 'granted') return
  window.gtag('event', name, params)
}
