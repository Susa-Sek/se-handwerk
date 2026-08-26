import Reveal from '../components/Reveal';
import { LegalHead, LegalSection, legalStyles as s } from '../components/legal';
import { useSeo } from '../hooks/useSeo';
import { seitenSeo } from '../content';

// Ported from the live sehandwerk.de Datenschutzerklärung. Two clauses adapted
// to the new site's stack: §4 (fonts are self-hosted here, not Google Fonts).
export default function Datenschutz() {
  useSeo(seitenSeo.datenschutz);
  return (
    <main>
      <LegalHead
        kicker="Informationen zum Umgang mit Ihren Daten gemäß DSGVO"
        title="Datenschutz"
      />

      <section style={{ background: '#EFE9DE', padding: '20px 0 110px' }}>
        <div style={s.container}>
          <LegalSection title="1. Verantwortlicher">
            <p style={s.p}>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <p style={s.p}>
              <strong style={s.strong}>Said &amp; Tuzcuoglu GbR</strong> (handelnd als SE Handwerk)
              <br />
              Sulieman Said &amp; Emre Tuzcuoglu
              <br />
              Anschrift: siehe Impressum
              <br />
              <br />
              E-Mail:{' '}
              <a href="mailto:kontakt@sehandwerk.de" style={s.a}>
                kontakt@sehandwerk.de
              </a>
            </p>
          </LegalSection>

          <LegalSection title="2. Erhebung und Speicherung personenbezogener Daten">
            <p style={s.sub}>a) Beim Besuch der Website</p>
            <p style={s.p}>
              Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden
              Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen
              werden temporär in einem sogenannten Logfile gespeichert. Folgende Informationen werden dabei
              ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:
            </p>
            <ul>
              <li style={s.li}>IP-Adresse des anfragenden Rechners</li>
              <li style={s.li}>Datum und Uhrzeit des Zugriffs</li>
              <li style={s.li}>Name und URL der abgerufenen Datei</li>
              <li style={s.li}>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
              <li style={s.li}>Verwendeter Browser und ggf. das Betriebssystem sowie der Name Ihres Access-Providers</li>
            </ul>
            <p style={s.p}>Die genannten Daten werden zu folgenden Zwecken verarbeitet:</p>
            <ul>
              <li style={s.li}>Gewährleistung eines reibungslosen Verbindungsaufbaus der Website</li>
              <li style={s.li}>Gewährleistung einer komfortablen Nutzung unserer Website</li>
              <li style={s.li}>Auswertung der Systemsicherheit und -stabilität</li>
            </ul>
            <p style={s.p}>
              Die Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 S. 1 lit. f DSGVO. Unser
              berechtigtes Interesse folgt aus den oben aufgelisteten Zwecken zur Datenerhebung.
            </p>

            <p style={{ ...s.sub, marginTop: 18 }}>b) Kontaktformular</p>
            <p style={s.p}>
              Wenn Sie uns über das Kontaktformular auf unserer Website eine Anfrage senden, werden Ihre
              Angaben aus dem Formular (Name, E-Mail-Adresse, Telefonnummer, PLZ/Ort, gewünschte Leistung,
              Nachricht) zur Bearbeitung Ihrer Anfrage und für den Fall von Anschlussfragen bei uns
              gespeichert.
            </p>
            <p style={s.p}>
              <strong style={s.strong}>Datenverarbeitung durch FormSubmit.co:</strong> Unser Kontaktformular
              nutzt den Dienst FormSubmit.co zur Übermittlung Ihrer Formulardaten per E-Mail an uns. Dabei
              werden Ihre eingegebenen Daten an die Server von FormSubmit.co übertragen, dort verarbeitet und
              als E-Mail an uns weitergeleitet. FormSubmit.co speichert keine Formulardaten dauerhaft. Weitere
              Informationen finden Sie in der Datenschutzerklärung von FormSubmit.co unter{' '}
              <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer" style={s.a}>
                https://formsubmit.co/privacy.pdf
              </a>
              .
            </p>
            <p style={s.p}>
              Die Rechtsgrundlage für die Verarbeitung der Daten ist Art. 6 Abs. 1 S. 1 lit. b DSGVO
              (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 S. 1 lit. f DSGVO (berechtigtes Interesse an der
              Beantwortung von Anfragen).
            </p>

            <p style={{ ...s.sub, marginTop: 18 }}>c) Kontaktaufnahme per E-Mail oder Telefon</p>
            <p style={s.p}>
              Wenn Sie uns per E-Mail oder Telefon kontaktieren, werden die von Ihnen mitgeteilten Daten
              (z. B. Name, E-Mail-Adresse, Telefonnummer, Inhalt Ihrer Anfrage) von uns zur Bearbeitung Ihrer
              Anfrage gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
            </p>
            <p style={s.p}>
              Die Rechtsgrundlage für die Verarbeitung ist Art. 6 Abs. 1 S. 1 lit. b DSGVO, sofern sich Ihre
              Anfrage auf einen Vertrag bezieht, oder Art. 6 Abs. 1 S. 1 lit. f DSGVO bei allgemeinen
              Anfragen.
            </p>
          </LegalSection>

          <LegalSection title="3. Hosting">
            <p style={s.p}>Unsere Website wird gehostet bei:</p>
            <p style={s.p}>
              <strong style={s.strong}>Vercel Inc.</strong>
              <br />
              440 N Barranca Ave #4133
              <br />
              Covina, CA 91723, USA
            </p>
            <p style={s.p}>
              Vercel verarbeitet in unserem Auftrag Daten, die beim Besuch unserer Website automatisch
              erhoben werden (siehe Abschnitt 2a). Die Nutzung von Vercel erfolgt auf Grundlage von Art. 6
              Abs. 1 S. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an einer zuverlässigen und
              schnellen Bereitstellung unserer Website.
            </p>
            <p style={s.p}>
              Vercel ist unter dem EU-US Data Privacy Framework zertifiziert, sodass ein angemessenes
              Datenschutzniveau gewährleistet ist. Weitere Informationen finden Sie in der
              Datenschutzerklärung von Vercel:{' '}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={s.a}>
                https://vercel.com/legal/privacy-policy
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="4. Schriftarten (selbst gehostet)">
            <p style={s.p}>
              Zur einheitlichen Darstellung von Schriftarten verwenden wir selbst gehostete Schriftarten.
              Beim Aufruf unserer Website werden die benötigten Schriftdateien direkt von unserem Server
              (bzw. dem Server unseres Hosters, siehe Abschnitt 3) geladen. Es werden hierbei{' '}
              <strong style={s.strong}>keine Daten an Dritte wie Google Fonts übertragen</strong>. Eine
              Verbindung zu externen Font-Anbietern findet nicht statt.
            </p>
          </LegalSection>

          <LegalSection title="5. Cookies und Webanalyse (Google Analytics 4)">
            <p style={s.p}>
              Technisch notwendige Speicherung: Für den Betrieb der Website speichern wir eine kleine
              Information lokal in Ihrem Browser (z. B. ob die Startanimation bereits gezeigt wurde sowie
              Ihre Cookie-Entscheidung). Diese Angaben sind für den Betrieb der Seite erforderlich, werden
              nicht an Dritte übermittelt und bedürfen keiner Einwilligung.
            </p>
            <p style={{ ...s.sub, marginTop: 18 }}>a) Google Analytics 4 – nur mit Ihrer Einwilligung</p>
            <p style={s.p}>
              Sofern Sie über unser Einwilligungs-Banner zugestimmt haben, verwenden wir{' '}
              <strong style={s.strong}>Google Analytics 4</strong>, einen Webanalysedienst der Google Ireland
              Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google Analytics verwendet Cookies
              (u. a. <em>_ga</em>, <em>_ga_*</em>), die eine Analyse Ihrer Nutzung der Website ermöglichen.
              Die erzeugten Informationen (z. B. aufgerufene Seiten, ungefährer Standort, Gerät/Browser)
              werden in der Regel an einen Server von Google übertragen und dort gespeichert. Die
              IP-Adresse wird von Google Analytics 4 gekürzt bzw. anonymisiert verarbeitet; eine
              Zusammenführung mit anderen Daten findet durch uns nicht statt.
            </p>
            <p style={s.p}>
              <strong style={s.strong}>Rechtsgrundlage</strong> ist Ihre Einwilligung nach Art. 6 Abs. 1
              lit. a DSGVO in Verbindung mit § 25 Abs. 1 TTDSG. Vor Ihrer Einwilligung werden{' '}
              <strong style={s.strong}>keine</strong> Analyse-Cookies gesetzt und es wird kein Kontakt zu
              Google-Servern hergestellt (Google Consent Mode v2, Standard „denied"). Der Analyse-Code wird
              erst nach aktiver Zustimmung geladen.
            </p>
            <p style={s.p}>
              <strong style={s.strong}>Datenübermittlung in Drittländer:</strong> Dabei kann es zu einer
              Verarbeitung in den USA durch die Google LLC kommen. Google stützt sich hierfür auf die
              EU-Standardvertragsklauseln und das EU-US Data Privacy Framework.
            </p>
            <p style={s.p}>
              <strong style={s.strong}>Widerruf:</strong> Sie können Ihre Einwilligung jederzeit mit Wirkung
              für die Zukunft widerrufen – über den Link{' '}
              <strong style={s.strong}>„Cookie-Einstellungen"</strong> im Seitenfuß. Weitere Informationen
              zur Datenverarbeitung durch Google finden Sie unter{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={s.a}
              >
                https://policies.google.com/privacy
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="6. Rechte der betroffenen Person">
            <p style={s.p}>Ihnen stehen folgende Rechte in Bezug auf Ihre personenbezogenen Daten zu:</p>
            <p style={s.sub}>a) Recht auf Auskunft (Art. 15 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, Auskunft über die von uns verarbeiteten personenbezogenen Daten zu
              verlangen.
            </p>
            <p style={s.sub}>b) Recht auf Berichtigung (Art. 16 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, die Berichtigung unrichtiger oder die Vervollständigung Ihrer bei uns
              gespeicherten personenbezogenen Daten zu verlangen.
            </p>
            <p style={s.sub}>c) Recht auf Löschung (Art. 17 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, die Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu
              verlangen, soweit nicht die Verarbeitung zur Ausübung des Rechts auf freie Meinungsäußerung und
              Information, zur Erfüllung einer rechtlichen Verpflichtung, aus Gründen des öffentlichen
              Interesses oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen erforderlich
              ist.
            </p>
            <p style={s.sub}>d) Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
              verlangen.
            </p>
            <p style={s.sub}>e) Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, Ihre personenbezogenen Daten in einem strukturierten, gängigen und
              maschinenlesbaren Format zu erhalten oder die Übermittlung an einen anderen Verantwortlichen zu
              verlangen.
            </p>
            <p style={s.sub}>f) Recht auf Widerspruch (Art. 21 DSGVO)</p>
            <p style={s.p}>
              Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit
              gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen. Wir verarbeiten die
              personenbezogenen Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe
              für die Verarbeitung nachweisen.
            </p>
          </LegalSection>

          <LegalSection title="7. Widerruf der Einwilligung">
            <p style={s.p}>
              Soweit die Verarbeitung Ihrer personenbezogenen Daten auf einer Einwilligung beruht, haben Sie
              das Recht, diese Einwilligung jederzeit zu widerrufen. Die Rechtmäßigkeit der aufgrund der
              Einwilligung bis zum Widerruf erfolgten Verarbeitung wird dadurch nicht berührt. Ihren Widerruf
              können Sie per E-Mail an{' '}
              <a href="mailto:kontakt@sehandwerk.de" style={s.a}>
                kontakt@sehandwerk.de
              </a>{' '}
              richten.
            </p>
          </LegalSection>

          <LegalSection title="8. Beschwerderecht bei einer Aufsichtsbehörde">
            <p style={s.p}>
              Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht
              Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu, wenn Sie der Ansicht sind, dass die
              Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.
            </p>
            <p style={s.p}>Die für uns zuständige Aufsichtsbehörde ist:</p>
            <p style={s.p}>
              <strong style={s.strong}>
                Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
              </strong>
              <br />
              Lautenschlagerstraße 20
              <br />
              70173 Stuttgart
              <br />
              Telefon: 0711 / 615541-0
              <br />
              E-Mail: poststelle@lfdi.bwl.de
              <br />
              Website:{' '}
              <a href="https://www.baden-wuerttemberg.datenschutz.de" target="_blank" rel="noopener noreferrer" style={s.a}>
                www.baden-wuerttemberg.datenschutz.de
              </a>
            </p>
          </LegalSection>

          <LegalSection title="9. Aktualität und Änderung dieser Datenschutzerklärung">
            <p style={s.p}>
              Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Januar 2025. Durch die
              Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher bzw. behördlicher
              Vorgaben kann es notwendig werden, diese Datenschutzerklärung zu ändern. Die jeweils aktuelle
              Datenschutzerklärung kann jederzeit auf dieser Seite abgerufen werden.
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
