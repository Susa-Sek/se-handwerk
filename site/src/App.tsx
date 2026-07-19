import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { getLenis, scrollToId } from './lib/smoothScroll';
import { ScrollProvider } from './context/ScrollContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import RoterFaden from './components/RoterFaden';
import Home from './pages/Home';
import UeberUns from './pages/UeberUns';
import Kontakt from './pages/Kontakt';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const t = window.setTimeout(() => scrollToId(id), 80);
      return () => window.clearTimeout(t);
    }
    // route change → jump to top immediately (no smooth animation between pages)
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function App() {
  useSmoothScroll();
  return (
    <BrowserRouter>
      <ScrollProvider>
        <RoterFaden />
        <Nav />
        <ScrollManager />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ueber-uns" element={<UeberUns />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Footer />
      </ScrollProvider>
    </BrowserRouter>
  );
}
