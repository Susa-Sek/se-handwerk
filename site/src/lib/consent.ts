// Einwilligung für Analyse- und Werbe-Cookies (Google Consent Mode v2).
//
// Ohne Zustimmung setzt GA4 keine Cookies: index.html meldet Consent Mode auf
// "denied" vor, bevor gtag.js geladen wird. Erst eine Zustimmung hier schaltet
// die Speicherung frei.

export type Entscheidung = 'granted' | 'denied';

const SCHLUESSEL = 'se-handwerk-consent';

// Ereignis, damit Banner und Datenschutzseite auf eine Änderung reagieren,
// ohne einander zu kennen.
export const CONSENT_EVENT = 'se-consent-geaendert';

export function entscheidungLesen(): Entscheidung | null {
  try {
    const wert = localStorage.getItem(SCHLUESSEL);
    return wert === 'granted' || wert === 'denied' ? wert : null;
  } catch {
    // Privates Fenster oder blockierter Speicher: wie "noch nicht entschieden"
    // behandeln — der Banner erscheint dann erneut.
    return null;
  }
}

function gtagAktualisieren(entscheidung: Entscheidung): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  gtag('consent', 'update', {
    ad_storage: entscheidung,
    ad_user_data: entscheidung,
    ad_personalization: entscheidung,
    analytics_storage: entscheidung,
    functionality_storage: entscheidung,
    personalization_storage: entscheidung,
  });

  // Der erste Seitenaufruf fällt sonst unter den Tisch: Bis zur Zustimmung
  // durfte nichts gesendet werden.
  if (entscheidung === 'granted') {
    gtag('event', 'page_view', { page_path: window.location.pathname });
  }
}

export function entscheidungSetzen(entscheidung: Entscheidung): void {
  try {
    localStorage.setItem(SCHLUESSEL, entscheidung);
  } catch {
    // Nicht speicherbar: Die Entscheidung gilt dann nur für diese Sitzung.
  }
  gtagAktualisieren(entscheidung);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: entscheidung }));
}

/** Widerruf: Zustimmung zurücknehmen, Banner erscheint wieder. */
export function entscheidungWiderrufen(): void {
  try {
    localStorage.removeItem(SCHLUESSEL);
  } catch {
    // ignorieren
  }
  gtagAktualisieren('denied');
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
