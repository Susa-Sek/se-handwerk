import { useRef, useState } from 'react';
import Reveal from './Reveal';
import { useViewportProgress } from '../hooks/useViewportProgress';
import { clamp } from '../lib/motion';
import { SectionKicker } from './sections';

const mono = "'IBM Plex Mono',monospace";

// Signature set-piece: the renovation itself as an interactive comparison.
// The gold handle starts sweeping with the scroll (Tag 0 → Übergabe, same
// vocabulary as the Taktplan); as soon as the visitor grabs it, they control
// the timeline themselves.
export default function VorherNachher() {
  const [secRef, p] = useViewportProgress<HTMLElement>();
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragPos, setDragPos] = useState<number | null>(null);
  const dragging = useRef(false);

  // scroll-driven sweep until the user takes over
  const sweep = 12 + clamp((p - 0.25) / 0.4, 0, 1) * 55;
  const pos = dragPos ?? sweep;

  const posFromEvent = (clientX: number) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return;
    setDragPos(clamp(((clientX - r.left) / r.width) * 100, 3, 97));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    posFromEvent(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) posFromEvent(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <section ref={secRef} className="grain" style={{ background: 'var(--ink)', padding: '130px 0 140px', color: '#F5F2EC' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 44 }}>
          <div>
            <SectionKicker dark>Das Ergebnis</SectionKicker>
            <Reveal as="h2" delay={40} style={{ fontSize: 'clamp(34px,5vw,68px)', color: '#F5F2EC' }}>
              Von Tag 0 bis zur Übergabe.
            </Reveal>
          </div>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.08em', color: 'var(--gold)' }}>
            ← ZIEHEN SIE SELBST →
          </span>
        </div>

        <Reveal from="scale" delay={100}>
          <div
            ref={frameRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(245,242,236,0.12)',
              background: '#15171A',
              userSelect: 'none',
            }}
          >
            {/* after — full frame */}
            <img
              src="/images/nachher.jpg"
              alt="Fertig saniertes Zimmer bei der Übergabe"
              draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* before — clipped from the left */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${(100 - pos).toFixed(2)}% 0 0)`,
              }}
            >
              <img
                src="/images/vorher.jpg"
                alt=""
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.75)' }}
              />
            </div>

            {/* handle */}
            <div
              role="slider"
              aria-label="Vorher-Nachher-Vergleich"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pos)}
              tabIndex={0}
              onPointerDown={onPointerDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setDragPos(clamp(pos - 4, 3, 97));
                if (e.key === 'ArrowRight') setDragPos(clamp(pos + 4, 3, 97));
              }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${pos.toFixed(2)}%`,
                width: 44,
                marginLeft: -22,
                cursor: 'ew-resize',
                touchAction: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, marginLeft: -1, background: 'var(--gold)', boxShadow: '0 0 14px rgba(224,168,60,0.6)' }} />
              <span
                style={{
                  position: 'relative',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: '#0D0E10',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: mono,
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 8px 24px -8px rgba(224,168,60,0.7)',
                }}
              >
                ⇤⇥
              </span>
            </div>

            {/* day chips — same vocabulary as the Taktplan */}
            <span
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.08em',
                color: '#F5F2EC',
                background: 'rgba(13,14,16,0.72)',
                border: '1px solid rgba(245,242,236,0.2)',
                padding: '7px 12px',
                borderRadius: 100,
              }}
            >
              TAG 0
            </span>
            <span
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: '0.08em',
                color: '#0D0E10',
                background: 'var(--gold)',
                padding: '7px 12px',
                borderRadius: 100,
              }}
            >
              TAG 45 — ÜBERGABE
            </span>
          </div>
        </Reveal>

        <Reveal as="p" delay={160} style={{ marginTop: 26, fontFamily: mono, fontSize: 12.5, lineHeight: 1.7, color: 'rgba(245,242,236,0.55)', maxWidth: 560 }}>
          Ein Objekt, ein Taktplan, ein Termin — und dazwischen liegt unsere Arbeit.
          Den Übergabetermin bekommen Sie vorher schriftlich.
        </Reveal>
      </div>
    </section>
  );
}
