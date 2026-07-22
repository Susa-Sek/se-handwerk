export const leistungen = [
  {
    code: '01',
    slug: 'komplettsanierung',
    title: 'Komplettsanierung',
    desc: 'Wohnungen, Häuser, Gewerbeeinheiten. Vom Rückbau bis zur bezugsfertigen Übergabe.',
    delay: 0,
  },
  {
    code: '02',
    slug: 'bodenarbeiten',
    title: 'Bodenarbeiten',
    desc: 'Rückbau, Untergrundvorbereitung, Estricharbeiten, Vinyl, Laminat, Parkett, Fliesen.',
    delay: 80,
  },
  {
    code: '03',
    slug: 'wand-decke',
    title: 'Wand & Decke',
    desc: 'Trockenbau, Ständerwände, abgehängte Decken, Innenputz, Malerarbeiten.',
    delay: 160,
  },
  {
    code: '04',
    slug: 'bad-sanitaer',
    title: 'Bad & Sanitär',
    desc: 'Komplette Badsanierung inklusive aller notwendigen Gewerke.',
    delay: 240,
  },
  {
    code: '05',
    slug: 'einzelgewerke',
    title: 'Einzelgewerke',
    desc: 'Auch für abgegrenzte Aufgaben sind wir der richtige Ansprechpartner.',
    delay: 320,
  },
];

export const ablauf = [
  {
    num: '1',
    title: 'Aufnahme vor Ort',
    desc: 'Wir sehen uns das Objekt an, hören zu und verstehen, was Sie erreichen wollen. Kostenfrei und unverbindlich.',
    delay: 0,
  },
  {
    num: '2',
    title: 'Angebot',
    desc: 'Sie bekommen ein nachvollziehbares Angebot — transparent aufgeschlüsselt. Sie wissen vorher, was drinsteht.',
    delay: 90,
  },
  {
    num: '3',
    title: 'Ausführung',
    desc: 'Wir stimmen die Gewerke ab, halten den Ablauf zusammen und sind während der gesamten Bauzeit Ihr Ansprechpartner.',
    delay: 180,
  },
  {
    num: '4',
    title: 'Übergabe',
    desc: 'Gemeinsame Abnahme. Erst wenn Sie zufrieden sind, ist das Projekt für uns abgeschlossen.',
    delay: 270,
  },
];

export const zielgruppen = [
  {
    code: 'A',
    title: 'Kapitalanleger und Investoren',
    desc: 'Sie haben ein Objekt gekauft und wollen es schnell vermietbar oder verkaufsfertig haben. Wir übernehmen die Sanierung vollständig — auch wenn Sie nicht in der Region wohnen. Sie bekommen regelmäßige Updates, wir kümmern uns um den Rest.',
    delay: 0,
  },
  {
    code: 'B',
    title: 'Erbengemeinschaften und auswärtige Eigentümer',
    desc: 'Eine geerbte Immobilie zu sanieren, wenn man 300 Kilometer entfernt lebt, ist ein Vollzeitjob. Übernehmen wir gerne.',
    delay: 100,
  },
  {
    code: 'C',
    title: 'Private Bauherren',
    desc: 'Sie sanieren Ihr Zuhause und wollen sich nicht nebenbei zum Bauleiter fortbilden. Verständlich. Genau dafür sind wir da.',
    delay: 200,
  },
];

export const vorteile = [
  {
    n: '01',
    title: 'Alles aus einer Hand',
    desc: 'Boden, Wand, Bad, Innenausbau — wir machen Ihre Sanierung komplett. Sie brauchen niemanden sonst.',
    delay: 0,
  },
  {
    n: '02',
    title: 'Ein Ansprechpartner statt fünf',
    desc: 'Sie telefonieren mit uns — nicht mit dem Bodenleger, dem Maler und dem Trockenbauer.',
    delay: 80,
  },
  {
    n: '03',
    title: 'Realistische Termine',
    desc: 'Wir planen realistisch und halten, was wir zusagen. Wenn sich etwas ändert, erfahren Sie es von uns — vorher.',
    delay: 160,
  },
  {
    n: '04',
    title: 'Festpreis statt böser Überraschungen',
    desc: 'Ein verbindlicher Festpreis vor Baubeginn — klar aufgeschlüsselt. Was besprochen ist, gilt. Keine Nachträge aus dem Nichts.',
    delay: 240,
  },
];

export const regionen = [
  'Heilbronn',
  'Neckarsulm',
  'Sinsheim',
  'Stuttgart',
];

// ── Leistungs-Unterseiten (SEO) ─────────────────────────────────────────────
// Jede Leistung bekommt eine eigene, keyword-starke Landingpage unter
// /leistungen/<slug>. Aufbau je Seite: H1 (Keyword + Raum Heilbronn) → Intro →
// Leistungsumfang (keyword-reiche Unterpunkte) → Ablauf → FAQ → CTA.
export interface LeistungPunkt {
  titel: string;
  text: string;
}
export interface FaqItem {
  frage: string;
  antwort: string;
}
export interface LeistungDetail {
  slug: string;
  code: string;
  navTitle: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  kicker: string;
  intro: string;
  umfang: LeistungPunkt[];
  faq: FaqItem[];
}

export const leistungenDetail: LeistungDetail[] = [
  {
    slug: 'komplettsanierung',
    code: '01',
    navTitle: 'Komplettsanierung',
    metaTitle: 'Komplettsanierung Heilbronn – aus einer Hand | SE Handwerk',
    metaDescription:
      'Komplettsanierung im Raum Heilbronn: Wohnung, Haus oder Gewerbe – alle Gewerke aus einer Hand, ein Ansprechpartner, Festpreis. Jetzt unverbindlich anfragen.',
    h1: 'Komplettsanierung im Raum Heilbronn',
    kicker: 'Leistung 01 · Komplettsanierung',
    intro:
      'Sie wollen eine Wohnung, ein Haus oder eine Gewerbeeinheit komplett sanieren – ohne fünf Firmen zu koordinieren? Wir übernehmen Ihre Komplettsanierung im Raum Heilbronn von der Entkernung bis zur bezugsfertigen Übergabe. Alle Gewerke aus einer Hand, ein Ansprechpartner, ein Festpreis.',
    umfang: [
      { titel: 'Rückbau & Entkernung', text: 'Fachgerechter Rückbau von Böden, Wänden und Bädern inklusive Entsorgung – der saubere Start jeder Sanierung.' },
      { titel: 'Boden, Wand & Decke', text: 'Estrich, Vinyl, Laminat, Parkett und Fliesen, dazu Trockenbau, Innenputz und Malerarbeiten – vollständig abgestimmt.' },
      { titel: 'Bad & Sanitär', text: 'Komplette Badsanierung inklusive Fliesen und koordinierter Sanitär- und Anschlussarbeiten.' },
      { titel: 'Elektro & Anschlüsse', text: 'Wir koordinieren die notwendigen Fachgewerke, damit Elektrik, Wasser und Heizung sauber ineinandergreifen.' },
      { titel: 'Maler- & Endarbeiten', text: 'Spachteln, Streichen, Feinschliff – bis der Raum wirklich fertig ist, nicht nur „fast".' },
      { titel: 'Bezugsfertige Übergabe', text: 'Gemeinsame Abnahme und besenreine Übergabe. Vermietbar oder verkaufsfertig, wie Sie es brauchen.' },
    ],
    faq: [
      { frage: 'Was kostet eine Komplettsanierung?', antwort: 'Das hängt von Objekt, Zustand und Umfang ab. Nach einer Aufnahme vor Ort erhalten Sie ein transparent aufgeschlüsseltes Festpreis-Angebot – Sie wissen vorher, was drinsteht.' },
      { frage: 'Übernehmen Sie die Sanierung auch, wenn ich nicht in Heilbronn wohne?', antwort: 'Ja. Gerade für Kapitalanleger, Erben und auswärtige Eigentümer übernehmen wir die komplette Steuerung und halten Sie mit Updates auf dem Laufenden.' },
      { frage: 'Wie lange dauert eine Komplettsanierung?', antwort: 'Je nach Größe meist einige Wochen. Sie bekommen vor Baubeginn einen realistischen Taktplan – und wenn sich etwas verschiebt, erfahren Sie es zuerst von uns.' },
    ],
  },
  {
    slug: 'bodenarbeiten',
    code: '02',
    navTitle: 'Bodenarbeiten',
    metaTitle: 'Bodenleger Heilbronn – Vinyl, Laminat & Parkett | SE Handwerk',
    metaDescription:
      'Boden verlegen im Raum Heilbronn: Vinyl, Laminat, Parkett & Fliesen inklusive Untergrundvorbereitung, Trittschalldämmung und Sockelleisten. Fair kalkuliert – jetzt anfragen.',
    h1: 'Bodenleger im Raum Heilbronn',
    kicker: 'Leistung 02 · Bodenarbeiten',
    intro:
      'Neuer Boden für Wohnung, Haus oder Gewerbe? Wir verlegen Vinyl, Laminat, Parkett und Fliesen im Raum Heilbronn – inklusive Untergrundvorbereitung, Trittschalldämmung und Sockelleisten. Sauber verlegt, fair kalkuliert, termingerecht.',
    umfang: [
      { titel: 'Vinyl- & Designboden verlegen', text: 'Klick-Vinyl und vollflächig verklebter Designboden – strapazierfähig und ideal für Vermietung.' },
      { titel: 'Laminat verlegen', text: 'Laminat in allen Nutzungsklassen, sauber zugeschnitten und mit passender Trittschalldämmung.' },
      { titel: 'Parkett & Dielen', text: 'Verlegung und Aufarbeitung von Parkett – für Wohnräume, in denen es hochwertig sein soll.' },
      { titel: 'Fliesenarbeiten', text: 'Boden- und Wandfliesen für Wohnräume, Flure, Küchen und Bäder.' },
      { titel: 'Estrich & Untergrundvorbereitung', text: 'Ausgleichen, Grundieren, Spachteln – ein ebener, trockener Untergrund ist die halbe Miete.' },
      { titel: 'Trittschall & Sockelleisten', text: 'Trittschalldämmung und saubere Sockelleisten für den fertigen Gesamteindruck.' },
    ],
    faq: [
      { frage: 'Verlegen Sie auch nur den Boden, ohne weitere Arbeiten?', antwort: 'Ja. Bodenarbeiten übernehmen wir auch als einzelne Leistung – von der einzelnen Wohnung bis zur kompletten Etage.' },
      { frage: 'Bereiten Sie den Untergrund mit vor?', antwort: 'Ja. Ausgleichen, Grundieren und Spachteln gehören dazu. Ein sauberer Untergrund entscheidet über das Endergebnis.' },
      { frage: 'In welchen Orten sind Sie tätig?', antwort: 'Im gesamten Raum Heilbronn und Umgebung – von Neckarsulm über Sinsheim bis Stuttgart.' },
    ],
  },
  {
    slug: 'wand-decke',
    code: '03',
    navTitle: 'Wand & Decke',
    metaTitle: 'Trockenbau & Malerarbeiten Heilbronn | SE Handwerk',
    metaDescription:
      'Trockenbau, Ständerwände, abgehängte Decken, Innenputz und Malerarbeiten im Raum Heilbronn – sauber, planbar, aus einer Hand. Jetzt Angebot anfragen.',
    h1: 'Trockenbau & Malerarbeiten im Raum Heilbronn',
    kicker: 'Leistung 03 · Wand & Decke',
    intro:
      'Räume neu aufteilen, Decken abhängen, Wände glätten und streichen: Wir übernehmen Trockenbau und Malerarbeiten im Raum Heilbronn – als Teil Ihrer Sanierung oder als eigenständige Leistung. Sauber, planbar, aus einer Hand.',
    umfang: [
      { titel: 'Trockenbau & Ständerwände', text: 'Neue Raumaufteilung, Trennwände und Vorwandinstallationen in Metall-Ständerbauweise.' },
      { titel: 'Abgehängte Decken', text: 'Abgehängte Decken für Technik, Beleuchtung und eine ruhige Optik.' },
      { titel: 'Innenputz & Spachtelarbeiten', text: 'Glatte, streichfertige Wände – von der Grundspachtelung bis Q3/Q4.' },
      { titel: 'Malerarbeiten & Anstrich', text: 'Grundieren, Streichen, Lackieren – Wohnräume, Flure und Gewerbeflächen.' },
      { titel: 'Dämmung', text: 'Trockenbaudämmung für Schall und Wärme dort, wo sie gebraucht wird.' },
      { titel: 'Untergrund & Vorbereitung', text: 'Abkleben, Ausbessern, Untergrund prüfen – damit das Ergebnis dauerhaft hält.' },
    ],
    faq: [
      { frage: 'Machen Sie auch nur Malerarbeiten?', antwort: 'Ja. Maler- und Trockenbauarbeiten übernehmen wir auch einzeln – etwa vor einer Vermietung oder Übergabe.' },
      { frage: 'Können Sie einen Raum neu aufteilen?', antwort: 'Ja. Mit Trockenbau und Ständerwänden schaffen wir neue Räume, ohne in die Statik einzugreifen.' },
      { frage: 'Wie sauber läuft das ab?', antwort: 'Wir arbeiten staubarm und geschützt, räumen die Baustelle täglich auf und übergeben besenrein.' },
    ],
  },
  {
    slug: 'bad-sanitaer',
    code: '04',
    navTitle: 'Bad & Sanitär',
    metaTitle: 'Badsanierung Heilbronn – Komplettbad aus einer Hand | SE Handwerk',
    metaDescription:
      'Badsanierung im Raum Heilbronn: Komplettbad von Rückbau über Fliesen bis Sanitär – alle Gewerke koordiniert, ein Ansprechpartner, Festpreis. Jetzt anfragen.',
    h1: 'Badsanierung im Raum Heilbronn',
    kicker: 'Leistung 04 · Bad & Sanitär',
    intro:
      'Ein neues Bad ist Koordination pur: Rückbau, Fliesen, Sanitär, Trockenbau und Maler müssen ineinandergreifen. Wir übernehmen Ihre Badsanierung im Raum Heilbronn komplett – alle Gewerke koordiniert, ein Ansprechpartner, ein Festpreis.',
    umfang: [
      { titel: 'Rückbau des alten Bads', text: 'Demontage und Entsorgung von Fliesen, Sanitärobjekten und Altbestand.' },
      { titel: 'Fliesen- & Bodenarbeiten', text: 'Boden- und Wandfliesen, Abdichtung und ebene Untergründe – fachgerecht ausgeführt.' },
      { titel: 'Sanitär & Anschlüsse', text: 'Wir koordinieren die Sanitärarbeiten, damit Wasser, Abfluss und Objekte sauber sitzen.' },
      { titel: 'Barrierearme Duschen', text: 'Bodengleiche Duschen und barrierearme Lösungen – auf Wunsch altersgerecht geplant.' },
      { titel: 'Trockenbau & Vorwände', text: 'Vorwandinstallationen, Nischen und abgehängte Decken für Technik und Optik.' },
      { titel: 'Maler & Übergabe', text: 'Endarbeiten und gemeinsame Abnahme – bis das Bad wirklich bezugsfertig ist.' },
    ],
    faq: [
      { frage: 'Koordinieren Sie auch den Sanitär-Fachbetrieb?', antwort: 'Ja. Sie haben einen Ansprechpartner – wir stimmen die beteiligten Fachgewerke aufeinander ab, damit nichts aufeinander wartet.' },
      { frage: 'Bekomme ich für die Badsanierung einen Festpreis?', antwort: 'Ja. Nach der Aufnahme vor Ort erhalten Sie ein transparentes Festpreis-Angebot – klar aufgeschlüsselt, ohne Nachträge aus dem Nichts.' },
      { frage: 'Ist ein barrierefreies Bad möglich?', antwort: 'Bodengleiche Duschen und barrierearme Lösungen setzen wir gerne um – sprechen Sie uns bei der Aufnahme darauf an.' },
    ],
  },
  {
    slug: 'einzelgewerke',
    code: '05',
    navTitle: 'Einzelgewerke',
    metaTitle: 'Handwerker Heilbronn für Einzelaufträge & Montage | SE Handwerk',
    metaDescription:
      'Einzelne Handwerksleistungen im Raum Heilbronn: Malerarbeiten, Bodenverlegung, Trockenbau, Möbelmontage und Wohnungsübergabe – zuverlässig und planbar. Jetzt anfragen.',
    h1: 'Einzelne Gewerke & Renovierungsarbeiten',
    kicker: 'Leistung 05 · Einzelgewerke',
    intro:
      'Nicht immer ist es die große Sanierung. Auch für abgegrenzte Aufgaben im Raum Heilbronn sind wir der richtige Ansprechpartner – von Malerarbeiten über Bodenverlegung und Trockenbau bis zu Möbelmontage und Wohnungsübergabe. Zuverlässig, sauber, planbar.',
    umfang: [
      { titel: 'Malerarbeiten', text: 'Streichen und Ausbessern – ideal vor Vermietung, Verkauf oder Einzug.' },
      { titel: 'Bodenverlegung', text: 'Vinyl, Laminat oder Parkett für einzelne Räume oder ganze Wohnungen.' },
      { titel: 'Trockenbau', text: 'Trennwände, Vorwände und abgehängte Decken als Einzelauftrag.' },
      { titel: 'Möbel- & Küchenmontage', text: 'Professioneller Aufbau von Möbeln, Regalsystemen und Küchen – sauber und nach Plan.' },
      { titel: 'Wohnungsübergabe & Instandsetzung', text: 'Kleinreparaturen, Ausbesserungen und Übergabeservice, damit die Wohnung übergabefertig ist.' },
      { titel: 'Kleinreparaturen', text: 'Die vielen kleinen Dinge, für die sonst niemand kommt – gebündelt bei einem Ansprechpartner.' },
    ],
    faq: [
      { frage: 'Übernehmen Sie auch kleine Aufträge?', antwort: 'Ja. Auch abgegrenzte Einzelarbeiten führen wir aus – oft gebündelt, damit sich der Termin für Sie und uns lohnt.' },
      { frage: 'Montieren Sie auch Möbel und Küchen?', antwort: 'Ja. Möbel-, Regal- und Küchenmontage gehören dazu – professionell aufgebaut und ausgerichtet.' },
      { frage: 'Helfen Sie bei der Wohnungsübergabe?', antwort: 'Ja. Ausbesserungen, Malerarbeiten und Kleinreparaturen aus einer Hand, damit die Übergabe stressfrei läuft.' },
    ],
  },
];

export function getLeistung(slug: string | undefined): LeistungDetail | undefined {
  return leistungenDetail.find((l) => l.slug === slug);
}
