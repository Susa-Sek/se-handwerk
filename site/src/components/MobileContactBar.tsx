import type { CSSProperties } from 'react'
import { trackEvent } from '../lib/analytics'

// Feste Kontaktleiste am unteren Rand – nur auf Mobil sichtbar (≤760px, dort
// wo der Header-CTA ausgeblendet wird). Zwei schnellste Lead-Kanäle: Anrufen
// und WhatsApp. Sichtbarkeit steuert index.css (.mobile-contact-bar).
const PHONE = '+49 173 4536225'
const TEL = 'tel:+491734536225'
const WA = 'https://wa.me/491734536225'

function track(method: 'phone' | 'whatsapp') {
  trackEvent('cta_click', { location: 'mobile_bar', label: method })
  trackEvent('generate_lead', { method })
}

export default function MobileContactBar() {
  return (
    <div className="mobile-contact-bar" role="region" aria-label="Schnellkontakt">
      <a href={TEL} onClick={() => track('phone')} style={{ ...btn, ...call }} aria-label="Anrufen">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
          <path
            d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1z"
            fill="currentColor"
          />
        </svg>
        Anrufen
      </a>
      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('whatsapp')}
        style={{ ...btn, ...wa }}
        aria-label={`WhatsApp ${PHONE}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
          <path
            d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.34A10 10 0 1 0 12 2zm5.85 14.13c-.25.7-1.44 1.33-2 1.37-.51.04-1.16.06-1.87-.12a17 17 0 0 1-1.7-.63 13.3 13.3 0 0 1-5.1-4.5c-.38-.5-1.34-1.78-1.34-3.4s.85-2.42 1.15-2.75a1.2 1.2 0 0 1 .87-.4h.62c.2 0 .47-.08.73.56.25.62.87 2.15.94 2.3.07.16.12.34.02.54-.1.2-.15.33-.3.5l-.42.5c-.14.14-.28.3-.12.58.16.28.72 1.18 1.55 1.92 1.06.94 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.2.7-.8.88-1.08.18-.28.36-.23.6-.14.25.1 1.57.74 1.84.88.28.14.46.2.53.32.07.12.07.66-.18 1.36z"
            fill="currentColor"
          />
        </svg>
        WhatsApp
      </a>
    </div>
  )
}

const btn: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  padding: '15px 12px',
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  borderRadius: 12,
}

const call: CSSProperties = {
  background: 'var(--gold, #E0A83C)',
  color: 'var(--ink, #0D0E10)',
}

const wa: CSSProperties = {
  background: '#25D366',
  color: '#0B2E17',
}
