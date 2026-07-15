import { Link } from 'react-router-dom';
import { useSectionLink } from '../hooks/useSectionLink';

const mono = "'IBM Plex Mono',monospace";

const colLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10.5,
  color: '#6E7B88',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 2,
};
const colLink: React.CSSProperties = { fontFamily: mono, fontSize: 12.5 };

export default function Footer() {
  const onSection = useSectionLink();

  return (
    <footer style={{ background: '#0E1822', color: '#EDF1F5', padding: '56px 0 40px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 32,
            paddingBottom: 36,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque',sans-serif",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '-0.02em',
                marginBottom: 10,
              }}
            >
              SE Handwerk
            </div>
            <p style={{ fontFamily: mono, fontSize: 12, color: '#8A97A3', lineHeight: 1.9 }}>
              Said &amp; Tuzcuoglu GbR
              <br />
              Steinsfeldstraße 21 · 74626 Bretzfeld
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
              <a href="#" className="footer-link" style={colLink}>
                Impressum
              </a>
              <a href="#" className="footer-link" style={colLink}>
                Datenschutz
              </a>
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
            color: '#6E7B88',
            letterSpacing: '0.04em',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span>© 2026 SE HANDWERK — SANIERUNG AUS EINER HAND</span>
          <span>RAUM HEILBRONN / HOHENLOHE</span>
        </div>
      </div>
    </footer>
  );
}
