export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (x: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, x));

// smoothstep — the eased interpolation used throughout the Taktplan set-piece
export const smoothstep = (t: number): number => t * t * (3 - 2 * t);

const hexToRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
};

export const mixHex = (a: string, b: string, t: number): string => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
};
