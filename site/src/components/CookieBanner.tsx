import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  CONSENT_REOPEN_EVENT,
  denyConsent,
  grantConsent,
  hasDecision,
  initConsent,
} from '../lib/consent'

// DSGVO-/TTDSG-konformes Opt-in-Banner für Google Analytics 4.
// Erscheint nur, solange keine Entscheidung vorliegt (oder erneut geöffnet
// über den Footer-Link). „Ablehnen" und „Akzeptieren" sind gleichwertig.
export default function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Gespeicherte Einwilligung wiederherstellen (lädt gtag.js nur bei 'granted').
    initConsent()
    if (!hasDecision()) setOpen(true)

    const reopen = () => setOpen(true)
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen)
  }, [])

  if (!open) return null

  const accept = () => {
    grantConsent()
    setOpen(false)
  }
  const decline = () => {
    denyConsent()
    setOpen(false)
  }

  return (
    <div role="dialog" aria-label="Datenschutz-Einstellungen" aria-live="polite" style={wrap}>
      <div style={card}>
        <div style={textCol}>
          <p style={title}>Datenschutz &amp; Statistik</p>
          <p style={body}>
            Wir würden gern anonymisierte Nutzungsstatistiken mit{' '}
            <strong style={strong}>Google Analytics</strong> erheben, um unsere Website zu
            verbessern. Dabei werden Cookies gesetzt und Daten an Google übertragen – nur mit
            Ihrer Einwilligung. Ohne Zustimmung wird nichts geladen. Details in unserer{' '}
            <Link to="/datenschutz" style={link} onClick={() => setOpen(false)}>
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
        <div style={btnRow}>
          <button type="button" onClick={decline} style={btnGhost}>
            Ablehnen
          </button>
          <button type="button" onClick={accept} style={btnSolid}>
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  )
}

const wrap: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2147483000,
  padding: 'clamp(12px, 3vw, 24px)',
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
}

const card: CSSProperties = {
  pointerEvents: 'auto',
  width: 'min(920px, 100%)',
  background: 'var(--ink, #0D0E10)',
  color: 'var(--paper, #FAF7F2)',
  border: '1px solid var(--line-paper, rgba(245,242,236,0.14))',
  borderRadius: 16,
  boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
  padding: 'clamp(18px, 3vw, 26px)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'clamp(14px, 3vw, 28px)',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const textCol: CSSProperties = { flex: '1 1 380px', minWidth: 260 }

const title: CSSProperties = {
  margin: '0 0 6px',
  fontWeight: 700,
  fontSize: '1.02rem',
  letterSpacing: '-0.01em',
}

const body: CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  lineHeight: 1.55,
  color: 'rgba(245,242,236,0.82)',
}

const strong: CSSProperties = { color: 'var(--paper, #FAF7F2)', fontWeight: 600 }

const link: CSSProperties = {
  color: 'var(--gold, #E0A83C)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
}

const btnRow: CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
}

const btnBase: CSSProperties = {
  appearance: 'none',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 600,
  fontSize: '0.92rem',
  padding: '11px 22px',
  borderRadius: 10,
  transition: 'transform .12s ease, opacity .12s ease',
}

const btnGhost: CSSProperties = {
  ...btnBase,
  background: 'transparent',
  color: 'var(--paper, #FAF7F2)',
  border: '1px solid rgba(245,242,236,0.32)',
}

const btnSolid: CSSProperties = {
  ...btnBase,
  background: 'var(--gold, #E0A83C)',
  color: 'var(--ink, #0D0E10)',
  border: '1px solid var(--gold, #E0A83C)',
}
