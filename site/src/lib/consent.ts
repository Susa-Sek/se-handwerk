// GDPR-/TTDSG-konformer Consent-Gate für Google Analytics 4.
//
// Google wird ERST nach aktiver Einwilligung kontaktiert: gtag.js wird bei
// Zustimmung nachgeladen (loadGtag), vorher steht analytics_storage per
// Consent Mode v2 (index.html) auf 'denied' und es fließen keine Daten.
// Die Entscheidung wird nur in localStorage (First-Party, technisch notwendig)
// gespeichert – kein weiteres Cookie.

const STORAGE_KEY = 'se-consent-v1'
const GA_ID = 'G-8FEM0QHGZ1'

/** Wird ausgelöst, sobald der Nutzer eine Entscheidung getroffen hat. */
export const CONSENT_CHANGED_EVENT = 'se:consent-changed'
/** Wird vom Footer-Link ausgelöst, um das Banner erneut zu öffnen. */
export const CONSENT_REOPEN_EVENT = 'se:consent-reopen'

export type ConsentDecision = 'granted' | 'denied'

function read(): ConsentDecision | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

function write(v: ConsentDecision): void {
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {
    /* privater Modus / Storage blockiert – dann gilt die Entscheidung nur für diesen Aufruf */
  }
}

export function getConsent(): ConsentDecision | null {
  return read()
}

export function hasDecision(): boolean {
  return read() !== null
}

function callGtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { gtag?: (...a: unknown[]) => void }
  if (typeof w.gtag === 'function') w.gtag(...args)
}

let gtagRequested = false
function loadGtag(): void {
  if (gtagRequested || typeof document === 'undefined') return
  gtagRequested = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

function notifyChanged(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT))
  } catch {
    /* ignore */
  }
}

/** Nutzer stimmt zu: gtag.js laden, Consent auf granted, aktuelle Seite zählen. */
export function grantConsent(): void {
  write('granted')
  callGtag('consent', 'update', { analytics_storage: 'granted' })
  loadGtag()
  if (typeof location !== 'undefined') {
    callGtag('event', 'page_view', { page_path: location.pathname + location.search })
  }
  notifyChanged()
}

/** Nutzer lehnt ab: nichts laden, Consent bleibt denied. */
export function denyConsent(): void {
  write('denied')
  callGtag('consent', 'update', { analytics_storage: 'denied' })
  notifyChanged()
}

/**
 * Beim Seitenaufbau die gespeicherte Entscheidung wiederherstellen.
 * Nur bei 'granted' wird gtag.js geladen – ablehnende oder fehlende
 * Entscheidungen kontaktieren Google nicht.
 */
export function initConsent(): void {
  if (read() === 'granted') {
    callGtag('consent', 'update', { analytics_storage: 'granted' })
    loadGtag()
  }
}

/** Footer-Link: Banner erneut öffnen, damit die Einwilligung geändert werden kann. */
export function reopenConsent(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT))
  } catch {
    /* ignore */
  }
}
