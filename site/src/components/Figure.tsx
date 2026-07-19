import { useState } from 'react';
import { useViewportProgress } from '../hooks/useViewportProgress';

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
  /** vertical parallax drift range in px (0 = static). The photo over-scans its
   *  frame and shifts as the figure travels the viewport, adding depth. */
  parallax?: number;
  style?: React.CSSProperties;
  className?: string;
}

// Renders a real photo from /images when present; until the file exists it
// falls back to an intentional on-brand blueprint plate (not a debug marker).
export default function Figure({ src, ratio, abb, caption, parallax = 0, style, className }: FigureProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ref, progress] = useViewportProgress<HTMLDivElement>();
  const showPlate = !loaded || failed;
  const drift = parallax ? (progress - 0.5) * parallax : 0;
  const showImg = loaded && !failed;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        aspectRatio: ratio,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(20,26,32,0.11)',
        background: '#E4DDCF',
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
                'linear-gradient(rgba(20,26,32,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(20,26,32,0.035) 1px,transparent 1px)',
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

      {/* photo — over-scans the frame when parallax is on so the drift never
          exposes an edge */}
      <div
        style={{
          position: 'absolute',
          inset: parallax ? '-8% 0' : 0,
          transform: parallax ? `translate3d(0, ${drift.toFixed(1)}px, 0)` : undefined,
          willChange: parallax ? 'transform' : undefined,
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
            opacity: showImg ? 1 : 0,
            transition: 'opacity .6s ease',
          }}
        />
      </div>

      {/* subtle vignette + gold edge-light on the loaded photo, ties it to the
          blueprint palette */}
      {showImg && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(120% 100% at 50% 0%, transparent 55%, rgba(14,24,34,0.34) 100%)',
          }}
        />
      )}

      {/* plate number — top-left, drawing-sheet style */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          fontFamily: mono,
          fontSize: 10.5,
          color: showPlate ? '#74808B' : 'rgba(237,241,245,0.85)',
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
            color: '#6C7883',
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
