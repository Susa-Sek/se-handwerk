import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ScrollProvider } from './context/ScrollContext';
import Nav from './components/Nav';
import Footer from './components/Footer';
import RoterFaden from './components/RoterFaden';
import Home from './pages/Home';
import UeberUns from './pages/UeberUns';
import Kontakt from './pages/Kontakt';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const t = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView();
      }, 60);
      return () => window.clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function App() {
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
          <Route path="*" element={<Home />} />
        </Routes>
        <Footer />
      </ScrollProvider>
    </BrowserRouter>
  );
}
