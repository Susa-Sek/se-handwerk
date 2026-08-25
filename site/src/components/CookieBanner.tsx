import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSENT_EVENT, entscheidungLesen, entscheidungSetzen } from '../lib/consent';

const mono = "'IBM Plex Mono',monospace";

// Beide Schaltflächen sind bewusst gleich gross und gleich prominent:
// Eine Einwilligung gilt nur als freiwillig, wenn Ablehnen nicht schwerer
// faellt als Zustimmen.
const knopf: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12.5,
  letterSpacing: '0.04em',
  padding: '11px 22px',
  borderRadius: 100,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flex: '1 1 auto',
  minWidth: 132,
};

export default function CookieBanner() {
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    setSichtbar(entscheidungLesen() === null);

    // Auf Widerruf von der Datenschutzseite reagieren.
    const beiAenderung = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSichtbar(detail === null);
    };
    window.addEventListener(CONSENT_EVENT, beiAenderung);
    return () => window.removeEventListener(CONSENT_EVENT, beiAenderung);
  }, []);

  if (!sichtbar) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Hinweis zu Cookies"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        maxWidth: 560,
        marginInline: 'auto',
        background: '#FFFFFF',
        border: '1px solid var(--line-ink)',
        borderRadius: 8,
        boxShadow: '0 24px 60px -24px rgba(13,14,16,0.45)',
        padding: '22px 24px',
      }}
    >
      <p
        style={{
          fontFamily: mono,
          fontSize: 10.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--t-dim)',
          margin: '0 0 10px',
        }}
      >
        Cookies
      </p>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--t-sub)', margin: '0 0 18px' }}>
        Wir würden gern mit Google Analytics messen, wie unsere Seite genutzt wird, und erkennen,
        über welche Anzeige Sie zu uns gefunden haben. Dafür werden Cookies gesetzt und Daten an
        Google übertragen. Das ist freiwillig — die Seite funktioniert ohne genauso.{' '}
        <Link to="/datenschutz" style={{ color: 'var(--gold-deep)' }}>
          Mehr in der Datenschutzerklärung
        </Link>
        .
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => entscheidungSetzen('denied')}
          style={{
            ...knopf,
            background: 'transparent',
            color: 'var(--t-ink)',
            border: '1px solid var(--line-ink)',
          }}
        >
          Ablehnen
        </button>
        <button
          type="button"
          onClick={() => entscheidungSetzen('granted')}
          className="btn-primary"
          style={{ ...knopf, border: 'none' }}
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
