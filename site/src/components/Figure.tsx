import { useState } from 'react';

const mono = "'IBM Plex Mono',monospace";

interface FigureProps {
  /** path under /images, e.g. "uebergabe.jpg" — shown when the file exists */
  src: string;
  /** CSS aspect-ratio, e.g. "4/5" */
  ratio: string;
  /** plate number label, e.g. "ABB. 02 / 4:5" */
  abb: string;
  /** caption describing the subject (also the alt text) */
  caption: string;
  style?: React.CSSProperties;
  className?: string;
}

// Renders a real photo from /images when present; until the file exists it
// falls back to an intentional on-brand blueprint plate (not a debug marker).
export default function Figure({ src, ratio, abb, caption, style, className }: FigureProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPlate = !loaded || failed;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        aspectRatio: ratio,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.11)',
        background: '#131F2B',
        ...style,
      }}
    >
      {/* blueprint plate (visible until the photo loads) */}
      {showPlate && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(201,154,69,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(201,154,69,0.06) 1px,transparent 1px)',
              backgroundSize: '150px 150px',
            }}
          />
          {/* centre crosshair */}
          <span style={{ position: 'absolute', left: '50%', top: '50%', width: 34, height: 1, background: 'rgba(201,154,69,0.4)', transform: 'translate(-50%,-50%)' }} />
          <span style={{ position: 'absolute', left: '50%', top: '50%', width: 1, height: 34, background: 'rgba(201,154,69,0.4)', transform: 'translate(-50%,-50%)' }} />
        </>
      )}

      <img
        src={`${import.meta.env.BASE_URL}images/${src}`}
        alt={caption}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded && !failed ? 1 : 0,
          transition: 'opacity .6s ease',
        }}
      />

      {/* plate number — top-left, drawing-sheet style */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontFamily: mono,
          fontSize: 10.5,
          color: showPlate ? '#7E8B98' : 'rgba(237,241,245,0.85)',
          letterSpacing: '0.05em',
          textShadow: showPlate ? 'none' : '0 1px 6px rgba(0,0,0,0.5)',
        }}
      >
        {abb}
      </div>

      {/* subject caption — reads as a deliberate annotation, not a placeholder */}
      {showPlate && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            fontFamily: mono,
            fontSize: 11.5,
            color: '#8A97A3',
            lineHeight: 1.55,
          }}
        >
          <span style={{ color: '#C99A45', flexShrink: 0 }}>—</span>
          <span>{caption}</span>
        </div>
      )}
    </div>
  );
}
