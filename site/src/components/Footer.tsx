import { Link } from 'react-router-dom';
import { useSectionLink } from '../hooks/useSectionLink';

const mono = "'IBM Plex Mono',monospace";

const colLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10.5,
  color: 'rgba(245,242,236,0.4)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 2,
};
const colLink: React.CSSProperties = { fontFamily: mono, fontSize: 12.5 };

export default function Footer() {
  const onSection = useSectionLink();

  return (
    <footer style={{ background: '#0D0E10', color: '#F5F2EC', padding: '56px 0 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 32,
            paddingBottom: 36,
            borderBottom: '1px solid rgba(245,242,236,0.1)',
          }}
        >
          <div>
            <img
              src="/images/logo-white.png"
              alt="SE Handwerk"
              style={{ height: 34, width: 'auto', display: 'block', marginBottom: 16 }}
            />
            <p style={{ fontFamily: mono, fontSize: 12, color: 'rgba(245,242,236,0.45)', lineHeight: 1.9 }}>
              SE Handwerk
              <br />
              Raum Heilbronn und Umgebung
            </p>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={colLabel}>Seite</span>
              <a href="/#leistungen" onClick={onSection('#leistungen')} className="footer-link" style={colLink}>
                Leistungen
              </a>
              <a href="/#ablauf" onClick={onSection('#ablauf')} className="footer-link" style={colLink}>
                Ablauf
              </a>
              <Link to="/ueber-uns" className="footer-link" style={colLink}>
                Über uns
              </Link>
              <Link to="/kontakt" className="footer-link" style={colLink}>
                Kontakt
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={colLabel}>Rechtliches</span>
              <Link to="/impressum" className="footer-link" style={colLink}>
                Impressum
              </Link>
              <Link to="/datenschutz" className="footer-link" style={colLink}>
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 24,
            fontFamily: mono,
            fontSize: 11,
            color: 'rgba(245,242,236,0.4)',
            letterSpacing: '0.04em',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span>© 2026 SE HANDWERK — SANIERUNG AUS EINER HAND</span>
          <span>RAUM HEILBRONN</span>
        </div>
      </div>
    </footer>
  );
}
