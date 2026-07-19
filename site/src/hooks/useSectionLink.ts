import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { scrollToId } from '../lib/smoothScroll';

// Anchor links to homepage sections must work from any route: scroll in place
// (through Lenis when active) when already on "/", otherwise navigate home and
// let the hash carry the target.
export function useSectionLink() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (hash: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      const id = hash.replace('#', '');
      if (location.pathname === '/') {
        scrollToId(id);
      } else {
        navigate('/#' + id);
      }
    },
    [location.pathname, navigate],
  );
}
