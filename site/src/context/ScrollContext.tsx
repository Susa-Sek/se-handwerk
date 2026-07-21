import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { clamp, prefersReducedMotion } from '../lib/motion';

interface ScrollState {
  docProgress: number;
  scrollY: number;
  taktProgress: number;
  reduced: boolean;
}

const ScrollContext = createContext<ScrollState>({
  docProgress: 0,
  scrollY: 0,
  taktProgress: 0,
  reduced: false,
});

export const useScroll = (): ScrollState => useContext(ScrollContext);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScrollState>({
    docProgress: 0,
    scrollY: 0,
    taktProgress: 0,
    reduced: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setState({ docProgress: 0, scrollY: 0, taktProgress: 1, reduced: true });
      return;
    }

    const onScroll = () => {
      const de = document.scrollingElement || document.documentElement;
      const sy = de.scrollTop;
      const max = de.scrollHeight - window.innerHeight;
      const dp = max > 0 ? clamp(sy / max, 0, 1) : 0;

      const sec = document.getElementById('takt-sec');
      let p = stateRef.current.taktProgress;
      if (sec) {
        const r = sec.getBoundingClientRect();
        const span = sec.offsetHeight - window.innerHeight;
        p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
      } else {
        p = 0;
      }

      const prev = stateRef.current;
      const upd: Partial<ScrollState> = {};
      if (Math.abs(p - prev.taktProgress) > 0.0015) upd.taktProgress = p;
      if (Math.abs(dp - prev.docProgress) > 0.0015) upd.docProgress = dp;
      if (Math.abs(sy - prev.scrollY) > 2) upd.scrollY = sy;
      if (Object.keys(upd).length) setState((s) => ({ ...s, ...upd }));
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        onScroll();
      });
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    onScroll();

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return <ScrollContext.Provider value={state}>{children}</ScrollContext.Provider>;
}
