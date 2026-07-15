import { useState } from 'react';

const mono = "'IBM Plex Mono',monospace";

const labelText: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10.5,
  color: '#8A97A3',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#14202E',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 4,
  padding: 12,
  color: '#EDF1F5',
  fontFamily: "'IBM Plex Sans',sans-serif",
  fontSize: 14,
  outlineColor: '#C99A45',
};

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: 6,
        background: '#223141',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 26px',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3', letterSpacing: '0.06em' }}>
          ANFRAGE — FORMBLATT A
        </span>
        <span style={{ fontFamily: mono, fontSize: 11, color: '#8A97A3' }}>RÜCKMELDUNG &lt; 24 H</span>
      </div>

      {sent ? (
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
              color: '#EDF1F5',
              letterSpacing: '-0.015em',
              marginBottom: 14,
              maxWidth: 380,
              marginInline: 'auto',
            }}
          >
            Danke — Ihre Anfrage ist eingegangen.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: '#AEB9C3', maxWidth: 360, margin: '0 auto' }}>
            Wir melden uns innerhalb von 24 Stunden und vereinbaren einen Termin vor Ort.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          style={{ padding: 26 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Name</span>
              <input type="text" name="name" autoComplete="name" style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Telefon</span>
              <input type="tel" name="phone" autoComplete="tel" style={inputStyle} />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'block' }}>
              <span style={labelText}>E-Mail</span>
              <input type="email" name="email" autoComplete="email" style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelText}>Objekt / Ort</span>
              <input type="text" name="objekt" style={inputStyle} />
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 22 }}>
            <span style={labelText}>Worum geht es?</span>
            <textarea rows={4} name="nachricht" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <button
            type="submit"
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
              cursor: 'pointer',
            }}
          >
            Anfrage senden
          </button>
        </form>
      )}
    </div>
  );
}
