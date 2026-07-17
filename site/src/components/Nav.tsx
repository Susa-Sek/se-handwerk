import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSectionLink } from '../hooks/useSectionLink';

const mono = "'IBM Plex Mono',monospace";

const linkStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 12,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export default function Nav() {
  const onSection = useSectionLink();
  const [open, setOpen] = useState(false);

  const go = (hash: string) => (e: React.MouseEvent) => {
    setOpen(false);
    onSection(hash)(e);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(22,34,47,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          height: 66,
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/"
          onClick={go('#top')}
          aria-label="SE Handwerk — Startseite"
          style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#EDF1F5' }}
        >
          <img
            src="/images/logo-white.png"
            alt="SE Handwerk"
            style={{ height: 30, width: 'auto', display: 'block' }}
          />
          <span
            className="nav-tag"
            style={{ fontFamily: mono, fontSize: 10.5, color: '#7E8B98', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
          >
            GbR · RAUM HEILBRONN
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <div style={{ display: 'flex', gap: 26, alignItems: 'center' }} className="nav-desktop">
            <a href="/#leistungen" onClick={go('#leistungen')} className="nav-link" style={linkStyle}>
              Leistungen
            </a>
            <a href="/#ablauf" onClick={go('#ablauf')} className="nav-link" style={linkStyle}>
              Ablauf
            </a>
            <a href="/#eigentuemer" onClick={go('#eigentuemer')} className="nav-link" style={linkStyle}>
              Für Eigentümer
            </a>
            <Link to="/ueber-uns" className="nav-link" style={linkStyle} onClick={() => setOpen(false)}>
              Über uns
            </Link>
          </div>
          <a
            href="/#kontakt"
            onClick={go('#kontakt')}
            className="btn-primary nav-cta"
            style={{ ...linkStyle, fontWeight: 500, padding: '11px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}
          >
            Projekt besprechen
          </a>

          <button
            type="button"
            aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="nav-burger"
            style={{
              display: 'none',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 5,
              width: 40,
              height: 40,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: 'block',
                width: 18,
                height: 1.5,
                background: '#EDF1F5',
                margin: '0 auto',
                transition: 'transform .25s',
                transform: open ? 'translateY(3.5px) rotate(45deg)' : 'none',
              }}
            />
            <span
              style={{
                display: 'block',
                width: 18,
                height: 1.5,
                background: '#EDF1F5',
                margin: '0 auto',
                transition: 'transform .25s',
                transform: open ? 'translateY(-3px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      <div
        className="nav-panel"
        style={{
          display: open ? 'block' : 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 40px 20px',
        }}
      >
        {[
          { label: 'Leistungen', hash: '#leistungen' },
          { label: 'Ablauf', hash: '#ablauf' },
          { label: 'Für Eigentümer', hash: '#eigentuemer' },
        ].map((l) => (
          <a
            key={l.hash}
            href={`/${l.hash}`}
            onClick={go(l.hash)}
            className="nav-link"
            style={{ ...linkStyle, display: 'block', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {l.label}
          </a>
        ))}
        <Link
          to="/ueber-uns"
          onClick={() => setOpen(false)}
          className="nav-link"
          style={{ ...linkStyle, display: 'block', padding: '14px 0' }}
        >
          Über uns
        </Link>
      </div>
    </nav>
  );
}
