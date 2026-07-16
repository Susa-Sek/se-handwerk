import Reveal from '../components/Reveal';
import { LegalHead, LegalSection, legalStyles as s } from '../components/legal';

// Content ported 1:1 from the live sehandwerk.de Impressum (Angaben gemäß § 5 TMG).
export default function Impressum() {
  return (
    <main>
      <LegalHead kicker="Angaben gemäß § 5 TMG" title="Impressum" />

      <section style={{ background: '#1B2937', padding: '20px 0 110px' }}>
        <div style={s.container}>
          <LegalSection title="Angaben gemäß § 5 TMG">
            <p style={s.p}>
              <strong style={s.strong}>Said &amp; Tuzcuoglu GbR</strong>
              <br />
              (handelnd unter dem Namen SE Handwerk)
              <br />
              Sulieman Said &amp; Emre Tuzcuoglu
              <br />
              Steinsfeldstr. 21
              <br />
              74626 Bretzfeld
            </p>
          </LegalSection>

          <LegalSection title="Kontakt">
            <p style={s.p}>
              E-Mail:{' '}
              <a href="mailto:kontakt@sehandwerk.de" style={s.a}>
                kontakt@sehandwerk.de
              </a>
            </p>
          </LegalSection>

          <LegalSection title="Steuernummer">
            <p style={s.p}>
              Steuernummer: 76050/96594
              <br />
              Finanzamt Öhringen
            </p>
            <p style={s.p}>
              Kleinunternehmer gemäß § 19 UStG — es wird keine Umsatzsteuer ausgewiesen.
            </p>
          </LegalSection>

          <LegalSection title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
            <p style={s.p}>
              Sulieman Said &amp; Emre Tuzcuoglu
              <br />
              Steinsfeldstr. 21
              <br />
              74626 Bretzfeld
            </p>
          </LegalSection>

          <LegalSection title="EU-Streitschlichtung">
            <p style={s.p}>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={s.a}>
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p style={s.p}>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            <p style={{ ...s.sub, marginTop: 18 }}>Verbraucherstreitbeilegung / Universalschlichtungsstelle</p>
            <p style={s.p}>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </LegalSection>

          <LegalSection title="Haftung für Inhalte">
            <p style={s.p}>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach
              den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter
              jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p style={s.p}>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst
              ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von
              entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </LegalSection>

          <LegalSection title="Haftung für Links">
            <p style={s.p}>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche
              Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
              erkennbar.
            </p>
            <p style={s.p}>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
              Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
              werden wir derartige Links umgehend entfernen.
            </p>
          </LegalSection>

          <LegalSection title="Urheberrecht">
            <p style={s.p}>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
              nicht kommerziellen Gebrauch gestattet.
            </p>
            <p style={s.p}>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
              Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
              Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
              entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte
              umgehend entfernen.
            </p>
          </LegalSection>

          <Reveal as="p" style={{ ...s.sub, marginTop: 40 }}>
            SE Handwerk · Raum Heilbronn
          </Reveal>
        </div>
      </section>
    </main>
  );
}
