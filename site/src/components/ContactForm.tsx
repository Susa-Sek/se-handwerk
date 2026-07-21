import { useState } from 'react';

const mono = "'IBM Plex Mono',monospace";

// FormSubmit endpoint. Uses the plain e-mail address (already public in the
// Impressum/Footer). After the first real submission FormSubmit sends a one-time
// activation link to this address — it must be clicked once before mails arrive.
// Optional later: swap for the hashed endpoint FormSubmit generates
// (https://formsubmit.co/ajax/<hash>) to keep the address out of the page source.
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/kontakt@sehandwerk.de';

const labelText: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10.5,
  color: 'var(--t-dim)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--paper2)',
  border: '1px solid rgba(20,23,26,0.16)',
  borderRadius: 4,
  padding: 12,
  color: 'var(--t-ink)',
  fontFamily: "'IBM Plex Sans',sans-serif",
  fontSize: 14,
  outlineColor: 'var(--gold)',
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    // honeypot — bots fill hidden fields; treat as success without sending
    if (data._honey) {
      setStatus('sent');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(FORMSUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          Name: data.name,
          Telefon: data.phone,
          'E-Mail': data.email,
          'Objekt / Ort': data.objekt,
          Nachricht: data.nachricht,
          _subject: 'Neue Anfrage über sehandwerk.de',
          _template: 'table',
          _captcha: 'false',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json.success === 'true' || json.success === true)) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--line-ink)',
        borderRadius: 6,
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 26px',
          borderBottom: '1px solid rgba(20,26,32,0.10)',
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)', letterSpacing: '0.06em' }}>
          ANFRAGE — FORMBLATT A
        </span>
        <span style={{ fontFamily: mono, fontSize: 11, color: 'var(--t-dim)' }}>RÜCKMELDUNG &lt; 24 H</span>
      </div>

      {status === 'sent' ? (
        <div style={{ padding: '48px 26px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: '#C99A45',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            ● Eingegangen
          </div>
          <p
            style={{
              fontFamily: "'Bricolage Grotesque',sans-serif",
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.3,
              color: 'var(--t-ink)',
              letterSpacing: '-0.015em',
              marginBottom: 14,
              maxWidth: 380,
              marginInline: 'auto',
            }}
          >
            Danke — Ihre Anfrage ist eingegangen.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#525E69', maxWidth: 360, margin: '0 auto' }}>
            Wir melden uns innerhalb von 24 Stunden und vereinbaren einen Termin vor Ort.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ padding: 26 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Name</span>
              <input type="text" name="name" autoComplete="name" required style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Telefon</span>
              <input type="tel" name="phone" autoComplete="tel" style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'block' }}>
              <span style={labelText}>E-Mail</span>
              <input type="email" name="email" autoComplete="email" required style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Objekt / Ort</span>
              <input type="text" name="objekt" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 22 }}>
            <span style={labelText}>Worum geht es?</span>
            <textarea rows={4} name="nachricht" required style={{ ...inputStyle, resize: 'vertical' }} />
          </label>

          {/* honeypot — hidden from users, catches bots */}
          <input
            type="text"
            name="_honey"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />

          {status === 'error' && (
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: '#E0895A',
                marginBottom: 16,
              }}
            >
              Das Senden hat leider nicht geklappt. Bitte versuchen Sie es erneut oder erreichen Sie uns
              direkt:{' '}
              <a href="tel:+491734536225" style={{ color: 'var(--gold-deep)' }}>
                +49&nbsp;173&nbsp;4536225
              </a>{' '}
              ·{' '}
              <a href="mailto:kontakt@sehandwerk.de" style={{ color: 'var(--gold-deep)' }}>
                kontakt@sehandwerk.de
              </a>
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-primary"
            style={{
              width: '100%',
              fontFamily: mono,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              padding: 16,
              borderRadius: 100,
              cursor: status === 'sending' ? 'default' : 'pointer',
              opacity: status === 'sending' ? 0.7 : 1,
            }}
          >
            {status === 'sending' ? 'Wird gesendet …' : 'Anfrage senden'}
          </button>
        </form>
      )}
    </div>
  );
}
