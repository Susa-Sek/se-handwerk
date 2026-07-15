import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { prefersReducedMotion } from '../lib/motion';

type Tag = 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'section';

interface RevealProps {
  as?: Tag;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
}

// Geometry-based reveal. We deliberately avoid IntersectionObserver here: in
// this app's scroll setup its intersection rect fails to follow the scroll
// position, so observers never fire for below-the-fold elements. Reading
// getBoundingClientRect() on a rAF-throttled scroll listener tracks the
// viewport reliably (the Taktplan set-piece uses the same signal).
export default function Reveal({
  as = 'div',
  delay = 0,
  className,
  style,
  id,
  children,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // reveal once the element's top edge has risen into the lower ~92% of the viewport
      if (r.top < window.innerHeight - 60 && r.bottom > 0) {
        setVisible(true);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      }
    };
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    };

    check(); // catch elements already in view on mount
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return createElement(
    as,
    {
      ref,
      id,
      className: `reveal${visible ? ' is-visible' : ''}${className ? ' ' + className : ''}`,
      style: { transitionDelay: `${delay}ms`, ...style },
    },
    children,
  );
}
