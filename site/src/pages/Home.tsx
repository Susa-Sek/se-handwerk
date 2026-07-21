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

export default function Home() {
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
      <RegionSection />
      <CtaBand />
      <KontaktSection />
    </main>
  );
}
