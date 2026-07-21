const bricolage = "'Bricolage Grotesque',sans-serif";

const ITEMS = ['Festpreis', 'Schriftlich', 'Ein Ansprechpartner', 'Ein Termin'];

function Row() {
  return (
    <div
      className="marquee-track"
      style={{ padding: '22px 0', fontFamily: bricolage, fontWeight: 700, fontSize: 'clamp(18px,2.2vw,28px)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}
    >
      {ITEMS.concat(ITEMS).map((w, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ color: i % 2 === 0 ? '#F5F2EC' : '#E0A83C', padding: '0 26px' }}>{w}</span>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(224,168,60,0.7)', flexShrink: 0 }} />
        </span>
      ))}
    </div>
  );
}

// Endless brand band — the promise on repeat, running like site tape between
// the hero and the Taktplan.
export default function Marquee() {
  return (
    <div className="marquee" aria-hidden>
      <Row />
      <Row />
    </div>
  );
}
