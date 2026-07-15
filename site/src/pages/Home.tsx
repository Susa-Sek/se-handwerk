import Hero from '../components/Hero';
import Taktplan from '../components/Taktplan';
import {
  AblaufSection,
  EigentuemerSection,
  ErgebnisBand,
  KontaktSection,
  LeistungenSection,
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
      <LeistungenSection />
      <AblaufSection />
      <EigentuemerSection />
      <WarumSESection />
      <ErgebnisBand />
      <RegionSection />
      <KontaktSection />
    </main>
  );
}
