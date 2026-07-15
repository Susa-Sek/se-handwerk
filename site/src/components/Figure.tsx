import { useState } from 'react';

const mono = "'IBM Plex Mono',monospace";

interface FigureProps {
  /** path under /images, e.g. "uebergabe.jpg" — shown when the file exists */
  src: string;
  /** CSS aspect-ratio, e.g. "4/5" */
  ratio: string;
  /** plate number label, e.g. "ABB. 02 / 4:5" */
  abb: string;
  /** caption describing the intended shot (also the alt text) */
  caption: string;
  style?: React.CSSProperties;
  className?: string;
}

// Renders a real photo from /images when present; until the file is generated
// it falls back to an on-brand blueprint placeholder with the shot brief.
export default function Figure({ src, ratio, abb, caption, style, className }: FigureProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !loaded || failed;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        aspectRatio: ratio,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.11)',
        background:
          'repeating-linear-gradient(135deg,#1C2A38,#1C2A38 13px,#223141 13px,#223141 26px)',
        ...style,
      }}
    >
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
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontFamily: mono,
          fontSize: 10.5,
          color: showPlaceholder ? '#7E8B98' : 'rgba(237,241,245,0.85)',
          letterSpacing: '0.05em',
          textShadow: showPlaceholder ? 'none' : '0 1px 6px rgba(0,0,0,0.5)',
        }}
      >
        {abb}
      </div>
      {showPlaceholder && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            fontFamily: mono,
            fontSize: 12,
            color: '#7C8894',
            lineHeight: 1.55,
          }}
        >
          [ BILDPLATZ ]
          <br />
          {caption}
        </div>
      )}
    </div>
  );
}
