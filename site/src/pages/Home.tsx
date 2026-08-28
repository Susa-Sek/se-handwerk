import Hero from '../components/Hero';
import Marquee from '../components/Marquee';
import Taktplan from '../components/Taktplan';
import VorherNachher from '../components/VorherNachher';
import LeistungenHorizontal from '../components/LeistungenHorizontal';
import {
  AblaufSection,
  CtaBand,
  EigentuemerSection,
  KontaktSection,
  ProblemSection,
  RegionSection,
  WarumSESection,
} from '../components/sections';
import FaqSection from '../components/FaqSection';
import Testimonials from '../components/Testimonials';
import { useSeo } from '../hooks/useSeo';
import { leistungenDetail, seitenSeo } from '../content';

export default function Home() {
  useSeo(seitenSeo.home);
  return (
    <main>
      <Hero />
      <Marquee />
      <Taktplan />
      <ProblemSection />
      <LeistungenHorizontal />
      <AblaufSection />
      <VorherNachher />
      <EigentuemerSection />
      <WarumSESection />
      <Testimonials />
      <RegionSection />
      <FaqSection faq={leistungenDetail[0].faq} title="Fragen &amp; Antworten zur Sanierung" />
      <CtaBand />
      <KontaktSection />
    </main>
  );
}
