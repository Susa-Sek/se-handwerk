import Hero from '../components/Hero';
import Taktplan from '../components/Taktplan';
import LeistungenHorizontal from '../components/LeistungenHorizontal';
import {
  AblaufSection,
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
      <Taktplan />
      <ProblemSection />
      <LeistungenHorizontal />
      <AblaufSection />
      <EigentuemerSection />
      <WarumSESection />
      <RegionSection />
      <KontaktSection />
    </main>
  );
}
