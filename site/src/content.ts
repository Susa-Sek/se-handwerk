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

// ── Blog (SEO-Ratgeber) ─────────────────────────────────────────────────────
export interface BlogSection {
  h2: string;
  paras: string[];
}
export interface BlogPost {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  excerpt: string;
  datum: string; // ISO
  kategorie: string;
  lesezeit: string;
  bild: string; // Hero-Bild (Dateiname in /images) — Symbolbild
  bildAlt: string;
  sections: BlogSection[];
  relatedLeistung?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'vinylboden-verlegen-kosten',
    metaTitle: 'Vinylboden verlegen: Kosten pro m² 2026 | SE Handwerk',
    metaDescription:
      'Was kostet Vinylboden verlegen pro m²? Preise für Material und Verlegung, Klick-Vinyl vs. vollverklebt, Untergrund, Zusatzkosten und ein Rechenbeispiel für 70 m².',
    title: 'Vinylboden verlegen: Kosten pro m² im Überblick',
    excerpt:
      'Material, Verlegung, Untergrund: Was Vinylboden wirklich pro Quadratmeter kostet – mit realistischen Richtwerten, Rechenbeispiel und den Posten, die man gern vergisst.',
    datum: '2026-07-22',
    kategorie: 'Bodenarbeiten',
    lesezeit: '8 Min.',
    bild: 'leistung-boden.jpg',
    bildAlt: 'Symbolbild: frisch verlegter Vinyl-Designboden in einem hellen Wohnraum',
    relatedLeistung: 'bodenarbeiten',
    sections: [
      {
        h2: 'Was kostet Vinylboden verlegen pro m²?',
        paras: [
          'Vinylboden verlegen zu lassen kostet – Material plus Arbeit zusammengerechnet – als grober Richtwert meist zwischen etwa 30 und 70 € pro Quadratmeter. Die Spanne ist deshalb so breit, weil drei Dinge stark ins Gewicht fallen: die Qualität des Vinylbodens, der Zustand des Untergrunds und die Verlegeart (Klick-Vinyl oder vollflächig verklebt).',
          'Für eine einfache, gute Ausführung im Wohnbereich landen viele Projekte im mittleren Bereich dieser Spanne. Nach oben offen wird es bei sehr hochwertigen Designböden, aufwändiger Untergrundvorbereitung oder kleinteiligen Grundrissen mit vielen Zuschnitten.',
          'Wichtig vorab: Das sind Marktrichtwerte zur Orientierung – kein Angebot. Den verbindlichen Preis für Ihr Objekt bekommen Sie erst nach einer kurzen Aufnahme vor Ort, dann aber als klaren Festpreis ohne Nachträge.',
        ],
      },
      {
        h2: 'Materialkosten: Was kostet der Vinylboden selbst?',
        paras: [
          'Das reine Material für Vinylboden kostet je nach Qualität ungefähr 15 bis 40 € pro m². Günstige Klick-Vinylböden beginnen darunter, hochwertige Designböden mit dicker Nutzschicht liegen darüber.',
          'Entscheidend für die Haltbarkeit ist die Nutzschicht (die transparente Deckschicht). Für Wohnräume reichen oft 0,3 bis 0,4 mm; für stark genutzte Flächen oder Vermietung sind 0,5 mm und mehr die sichere Wahl – sie halten Kratzern und Möbelrücken länger stand.',
          'Auch die Verlegeart beeinflusst den Materialpreis: Vollflächig zu verklebendes Vinyl ist als Material häufig günstiger als Klick-Vinyl, dafür steigt der Arbeitsaufwand.',
        ],
      },
      {
        h2: 'Verlegekosten: Was kostet die Arbeit?',
        paras: [
          'Für die reine Verlegung durch einen Fachbetrieb sollten Sie zusätzlich etwa 15 bis 30 € pro m² einplanen. Klick-Vinyl ist schneller verlegt und damit meist günstiger, vollflächiges Verkleben ist aufwändiger und liegt am oberen Ende.',
          'Kommt Untergrundvorbereitung dazu – Spachteln, Ausgleichen, Grundieren – erhöht sich der Arbeitsanteil spürbar. Genau hier trennt sich saubere Arbeit von Pfusch: Ein ebener, tragfähiger Untergrund ist die Voraussetzung für ein Ergebnis, das jahrelang hält.',
        ],
      },
      {
        h2: 'Klick-Vinyl oder vollflächig verkleben?',
        paras: [
          'Klick-Vinyl wird schwimmend verlegt, ist schneller fertig und meist günstiger. Es ist ideal für Wohnräume, Schlafzimmer und die klassische Mietwohnung – und lässt sich bei Bedarf leichter wieder aufnehmen.',
          'Vollflächig verklebtes Vinyl ist besonders belastbar und formstabil. Sinnvoll ist es bei großen zusammenhängenden Flächen, bei Fußbodenheizung und in stark frequentierten Bereichen wie Fluren oder Gewerberäumen, weil sich der Boden nicht bewegt.',
          'Als Faustregel gilt: Wohnung vermieten oder schnell fertig werden – Klick-Vinyl. Maximale Robustheit und Fußbodenheizung – verkleben.',
        ],
      },
      {
        h2: 'Untergrundvorbereitung – der unterschätzte Posten',
        paras: [
          'Der häufigste Grund für spätere Probleme ist ein schlecht vorbereiteter Untergrund. Unebenheiten drücken sich durch, Restfeuchte im Estrich führt zu Schäden, loser Altbelag verhindert eine saubere Verlegung.',
          'Je nach Zustand fallen Ausgleichsmasse, Grundierung, das Entfernen von Altbelägen oder eine Feuchtemessung an. Diese Arbeiten kosten extra, sind aber keine Option zum Weglassen – sie entscheiden über die Lebensdauer des Bodens.',
        ],
      },
      {
        h2: 'Diese Zusatzkosten kommen oft dazu',
        paras: [
          'Neben Material und Verlegung summieren sich Posten, die in Online-Rechnern gern fehlen: Rückbau und Entsorgung des alten Bodens, Trittschalldämmung, Sockelleisten, Übergangs- und Abschlussprofile sowie das Kürzen von Türblättern.',
          'Wer alles aus einer Hand vergibt, hat diese Posten von Anfang an im Festpreis – statt am Ende von Nachträgen überrascht zu werden. Das ist gerade bei der Vermietung wichtig, wo die Kalkulation stimmen muss.',
        ],
      },
      {
        h2: 'Rechenbeispiel: Vinylboden für eine 70-m²-Wohnung',
        paras: [
          'Ein grobes Beispiel zur Orientierung: Bei rund 45 € pro m² für verlegten Vinylboden inklusive üblicher Nebenarbeiten landet eine 70-m²-Wohnung bei etwa 3.150 €. Bei einfacherem Material und wenig Untergrundaufwand kann es deutlich darunter liegen, bei hochwertigem Designboden und aufwändigem Untergrund darüber.',
          'Solche Zahlen ersetzen kein Angebot – sie helfen nur, ein Gefühl für die Größenordnung zu bekommen. Den echten Preis bekommen Sie erst nach der Aufnahme vor Ort.',
        ],
      },
      {
        h2: 'Vinylboden verlegen lassen im Raum Heilbronn',
        paras: [
          'Wir verlegen Vinyl-, Design- und Klickböden im gesamten Raum Heilbronn – inklusive Untergrundvorbereitung, Trittschalldämmung und Sockelleisten. Sauber verlegt, fair kalkuliert und mit verbindlichem Festpreis vor Baubeginn.',
          'Gerade für Kapitalanleger und Vermieter übernehmen wir auf Wunsch die komplette Wohnung – Boden, Malerarbeiten und Übergabe im selben Zug, mit einem einzigen Ansprechpartner.',
        ],
      },
    ],
  },
  {
    slug: 'laminat-oder-vinyl',
    metaTitle: 'Laminat oder Vinyl? Der ehrliche Vergleich 2026 | SE Handwerk',
    metaDescription:
      'Laminat oder Vinyl – was ist besser für Wohnung, Vermietung und Fußbodenheizung? Aufbau, Wasserfestigkeit, Optik, Haltbarkeit und Kosten im ehrlichen Vergleich.',
    title: 'Laminat oder Vinyl? Der ehrliche Vergleich',
    excerpt:
      'Beide sehen gut aus und sind bezahlbar – doch bei Wasser, Fußbodenheizung, Haltbarkeit und Vermietung gibt es klare Unterschiede. Der nüchterne Vergleich mit Entscheidungshilfe.',
    datum: '2026-07-22',
    kategorie: 'Bodenarbeiten',
    lesezeit: '8 Min.',
    bild: 'nachher.jpg',
    bildAlt: 'Symbolbild: heller Wohnraum mit modernem Bodenbelag',
    relatedLeistung: 'bodenarbeiten',
    sections: [
      {
        h2: 'Laminat oder Vinyl – der schnelle Überblick',
        paras: [
          'Laminat ist ein Holzwerkstoff mit aufgedruckter Dekorschicht – warm in der Optik und angenehm im Preis. Vinyl (oft als Designboden verkauft) besteht aus Kunststoff, ist elastischer, leiser beim Begehen und vor allem feuchtigkeitsbeständig.',
          'Für die meisten Wohnungen ist Vinyl heute die robustere und pflegeleichtere Wahl. Laminat bleibt aber eine gute Option, wo es trocken ist und das Budget knapp bleiben soll.',
        ],
      },
      {
        h2: 'Aufbau und Material: Woraus bestehen die Böden?',
        paras: [
          'Laminat besteht aus einer HDF-Trägerplatte, der Dekorschicht und einem transparenten Overlay als Schutz. Das macht es hart und trittfest, aber empfindlich gegenüber stehendem Wasser.',
          'Vinyl gibt es als reinen Kunststoffboden oder als Rigid-/SPC-Variante mit mineralischem Trägerkern. Diese modernen Vinylböden sind besonders formstabil, wasserfest und dennoch fußwarm.',
        ],
      },
      {
        h2: 'Wasserfestigkeit: der wichtigste Unterschied',
        paras: [
          'Hier trennen sich die beiden klar: Vinyl verträgt Feuchtigkeit deutlich besser und ist – je nach Produkt – sogar für Küche und Bad geeignet. Verschüttetes Wasser ist kein Problem, solange es nicht tagelang steht.',
          'Laminat quillt bei stehendem Wasser an den Kanten auf und ist dann meist irreparabel. In Feuchträumen und dort, wo häufig gewischt wird, ist Laminat keine gute Wahl.',
          'Für die Vermietung spricht das klar für Vinyl: Es verzeiht Missgeschicke und sieht auch nach mehreren Mieterwechseln noch ordentlich aus.',
        ],
      },
      {
        h2: 'Fußbodenheizung: Was ist geeignet?',
        paras: [
          'Beide Böden lassen sich grundsätzlich auf Fußbodenheizung verlegen – entscheidend sind die Herstellerfreigabe und ein geringer Wärmedurchlasswiderstand.',
          'Vinyl, besonders vollflächig verklebt, leitet die Wärme sehr gut und ist hier oft die effizientere Wahl. Bei Laminat sollten Sie auf ein ausdrücklich für Fußbodenheizung freigegebenes Produkt achten.',
        ],
      },
      {
        h2: 'Optik, Haptik und Trittschall',
        paras: [
          'Laminat wirkt beim Begehen oft etwas härter und lauter, Vinyl fußwarm und leise. Beide Beläge gibt es in überzeugenden Holz- und Steindekoren, moderne Produkte sind optisch kaum von echtem Parkett zu unterscheiden.',
          'Für ruhige Räume und Mehrfamilienhäuser ist die passende Trittschalldämmung Pflicht – damit lassen sich beide Böden angenehm leise verlegen.',
        ],
      },
      {
        h2: 'Strapazierfähigkeit und Lebensdauer',
        paras: [
          'Laminat ist kratz- und druckfest, reagiert aber empfindlich auf Nässe und lässt sich nicht ausbessern. Vinyl ist unempfindlicher gegenüber Feuchtigkeit und Dellen, kann bei scharfen Gegenständen aber eher einschneiden.',
          'Über die Nutzungsdauer gerechnet liegen beide bei guter Qualität nah beieinander. Wichtiger als der Materialtyp ist die Qualität des konkreten Produkts – und ein fachgerecht vorbereiteter Untergrund.',
        ],
      },
      {
        h2: 'Kosten im Vergleich',
        paras: [
          'Laminat ist beim Material meist etwas günstiger, Vinyl liegt leicht darüber. Über die Lebensdauer ist der Unterschied gering – Qualität und Untergrund entscheiden mehr über den Preis als der Materialtyp allein.',
          'Konkrete Zahlen zu Material und Verlegung finden Sie in unserem Beitrag zu den Kosten fürs Vinylboden verlegen.',
        ],
      },
      {
        h2: 'Laminat oder Vinyl für die Vermietung?',
        paras: [
          'Für Mietwohnungen empfehlen wir in den meisten Fällen Vinyl: Es hält Feuchtigkeit, Reinigung und Mieterwechsel besser aus und reduziert Instandhaltungskosten über die Jahre.',
          'Laminat kann sinnvoll sein, wenn das Budget sehr eng ist und die Räume trocken bleiben – etwa Schlaf- und Wohnräume ohne Wasseranschluss.',
        ],
      },
      {
        h2: 'Fazit: Entscheidungshilfe',
        paras: [
          'Vermietung, Feuchträume, Fußbodenheizung, hohe Beanspruchung: Vinyl. Trockener Wohnraum mit knappem Budget: Laminat kann passen.',
          'Unsicher, was zu Ihrem Objekt im Raum Heilbronn passt? Wir beraten bei der Aufnahme vor Ort ehrlich, empfehlen nur, was wirklich sinnvoll ist – und verlegen beides fachgerecht, inklusive Untergrund und Sockelleisten.',
        ],
      },
    ],
  },
  {
    slug: 'wohnung-sanieren-vor-vermietung',
    metaTitle: 'Wohnung sanieren vor Vermietung: Ablauf, Reihenfolge & Kosten | SE Handwerk',
    metaDescription:
      'Wohnung vor der Vermietung sanieren: die richtige Reihenfolge der Gewerke, welche Arbeiten sich lohnen, Kostenfaktoren, realistischer Zeitplan und typische Fehler.',
    title: 'Wohnung sanieren vor der Vermietung: Ablauf & Reihenfolge',
    excerpt:
      'Wer die Gewerke in der falschen Reihenfolge beauftragt, verliert Wochen. So läuft eine Sanierung vor der Vermietung wirklich sauber ab – mit Reihenfolge, Kosten und Zeitplan.',
    datum: '2026-07-22',
    kategorie: 'Sanierung',
    lesezeit: '9 Min.',
    bild: 'leistung-komplett.jpg',
    bildAlt: 'Symbolbild: frisch sanierte, bezugsfertige Wohnung',
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Warum die Reihenfolge über die Bauzeit entscheidet',
        paras: [
          'Die häufigste Ursache für Verzögerungen bei einer Wohnungssanierung ist nicht ein einzelnes Gewerk, sondern die Koordination. Kommt der Bodenleger, bevor der Estrich trocken ist, oder der Maler, während der Trockenbau noch staubt, steht die Baustelle still und Termine platzen.',
          'Eine durchdachte Reihenfolge spart mehr Zeit als der Versuch, jedes einzelne Gewerk schneller auszuführen. Wer vor der Vermietung saniert, arbeitet außerdem gegen die Uhr: Jede Woche Leerstand kostet Miete.',
        ],
      },
      {
        h2: 'Die richtige Reihenfolge – Schritt für Schritt',
        paras: [
          'Schritt 1 – Rückbau und Entkernung: alter Boden, Tapeten, defekte Einbauten und Altbeläge raus, inklusive Entsorgung. Schritt 2 – Roharbeiten: Trockenbau, Elektro- und Sanitärleitungen dort verlegen, wo Wände noch offen sind.',
          'Schritt 3 – Putz, Spachtel, Estrich und die nötige Trocknungszeit. Schritt 4 – Fliesen und Bad. Schritt 5 – Bodenbeläge wie Vinyl, Laminat oder Parkett.',
          'Schritt 6 – Malerarbeiten und Feinschliff. Schritt 7 – Montagen (Türen, Leisten, Küche), Endreinigung und Übergabe. Alles Empfindliche kommt bewusst zum Schluss.',
        ],
      },
      {
        h2: 'Was zuerst, was zuletzt?',
        paras: [
          'Zwei Faustregeln helfen: von oben nach unten und von grob nach fein. Decke und Wände werden vor dem Boden fertig, staubintensive Arbeiten vor den empfindlichen, Malerarbeiten kurz vor Schluss.',
          'Der Boden kommt bewusst spät, damit er nicht durch nachfolgende Gewerke verkratzt oder verschmutzt wird. Wird diese Reihenfolge missachtet, zahlt man oft doppelt – einmal für die Arbeit, einmal für die Ausbesserung.',
        ],
      },
      {
        h2: 'Welche Arbeiten lohnen sich vor der Vermietung wirklich?',
        paras: [
          'Nicht jede Wohnung braucht eine Komplettsanierung. Den größten Effekt auf Vermietbarkeit und Miete haben meist frische Wände (Malerarbeiten), ein neuer, pflegeleichter Boden und ein zeitgemäßes Bad.',
          'Diese drei Bereiche entscheiden über den ersten Eindruck bei Besichtigungen. Küche, Elektrik und Fenster sind je nach Zustand zusätzliche Hebel, aber teurer – hier lohnt eine ehrliche Abwägung von Aufwand und Mietwirkung.',
        ],
      },
      {
        h2: 'Kostenfaktoren im Überblick',
        paras: [
          'Die Kosten einer Sanierung hängen von Zustand, Größe und Ausstattung ab. Der größte Hebel ist meist das Bad, gefolgt von Boden und Malerarbeiten. Auch der Umfang des Rückbaus und die Entsorgung schlagen zu Buche.',
          'Ein verbindlicher Festpreis vor Baubeginn schützt vor Nachträgen aus dem Nichts – besonders wichtig, wenn Sie als Kapitalanleger mit spitzer Feder rechnen und die Rendite stimmen muss.',
        ],
      },
      {
        h2: 'Budget realistisch planen',
        paras: [
          'Kalkulieren Sie neben den reinen Handwerkskosten immer einen Puffer für Überraschungen ein – gerade in Altbauten kommen hinter Boden und Wand manchmal Dinge zum Vorschein, die vorher niemand sehen konnte.',
          'Ein transparentes, aufgeschlüsseltes Angebot hilft, Prioritäten zu setzen: Was muss jetzt gemacht werden, was kann warten? So bleibt das Budget unter Kontrolle.',
        ],
      },
      {
        h2: 'Realistischer Zeitplan statt Wunschdenken',
        paras: [
          'Eine typische Wohnungssanierung dauert je nach Umfang einige Wochen. Seriös ist ein Taktplan, der Puffer enthält – auf Baustellen kann sich immer etwas verschieben, etwa durch Trocknungszeiten oder Lieferengpässe.',
          'Entscheidend ist Transparenz: Wenn sich etwas verschiebt, sollten Sie es zuerst erfahren, nicht zuletzt. Ehrliche Planung schlägt schöngerechnete Termine, die dann doch nicht halten.',
        ],
      },
      {
        h2: 'Häufige Fehler bei der Sanierung vor Vermietung',
        paras: [
          'Zu den teuersten Fehlern gehören: Gewerke in der falschen Reihenfolge beauftragen, mehrere Firmen selbst koordinieren müssen, an der Untergrundvorbereitung sparen und ohne Festpreis starten.',
          'Wer alle Gewerke einzeln vergibt, wird schnell zum unbezahlten Bauleiter – mit fünf Ansprechpartnern, die aufeinander warten. Genau das lässt sich vermeiden.',
        ],
      },
      {
        h2: 'Sanierung aus einer Hand im Raum Heilbronn',
        paras: [
          'Wir übernehmen die komplette Sanierung im Raum Heilbronn – alle Gewerke koordiniert, ein Ansprechpartner, ein verbindlicher Festpreis. Gerade für auswärtige Eigentümer, Kapitalanleger und Erben, die nicht ständig vor Ort sein können.',
          'Sie bekommen regelmäßige Updates und am Ende eine bezugsfertige, vermietbare Wohnung – ohne selbst zum Bauleiter zu werden.',
        ],
      },
    ],
  },
];

export function getPost(slug: string | undefined): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

// ── SEO-Meta je Standard-Seite ──────────────────────────────────────────────
export interface SeitenSeo {
  path: string;
  title: string;
  description: string;
  h1?: string;
  intro?: string;
}

export const seitenSeo: Record<string, SeitenSeo> = {
  home: {
    path: '/',
    // must match index.html so prerendered (keepHead) and client titles agree
    title: 'Komplettsanierung zum Festpreis · ein Ansprechpartner | SE Handwerk',
    description:
      'Ihre Immobilie, komplett saniert — zum Festpreis. Ein Ansprechpartner übernimmt Ihre Sanierung von der Aufnahme bis zur bezugsfertigen Übergabe. Raum Heilbronn.',
    h1: 'Sanierung aus einer Hand — Raum Heilbronn',
    intro:
      'SE Handwerk übernimmt Ihre Sanierung im Raum Heilbronn vollständig: von der ersten Begehung bis zur bezugsfertigen Übergabe. Ein Ansprechpartner koordiniert alle Gewerke — mit Festpreis-Angebot und realistischem Taktplan.',
  },
  'ueber-uns': {
    path: '/ueber-uns',
    title: 'Über uns – Sanierung aus einer Hand | SE Handwerk Heilbronn',
    description:
      'SE Handwerk aus dem Raum Heilbronn: Ihr Partner für Sanierung und Renovierung aus einer Hand — ein Ansprechpartner, verbindlicher Festpreis, realistische Termine.',
    h1: 'Über SE Handwerk',
    intro:
      'Wir sind Ihr Partner für Sanierung und Renovierung im Raum Heilbronn — mit einem klaren Versprechen: alle Gewerke aus einer Hand, ein fester Ansprechpartner und ein verbindlicher Festpreis.',
  },
  kontakt: {
    path: '/kontakt',
    title: 'Kontakt – Sanierung Raum Heilbronn | SE Handwerk',
    description:
      'Kontakt zu SE Handwerk im Raum Heilbronn: Rufen Sie an oder schreiben Sie uns. Kostenlose Ersteinschätzung — Rückmeldung meist noch am selben Tag.',
    h1: 'Kontakt',
    intro:
      'Erzählen Sie uns kurz von Ihrem Objekt — wir melden uns meist noch am selben Tag mit einer ersten Einschätzung. Kostenlos und unverbindlich, im gesamten Raum Heilbronn.',
  },
  impressum: {
    path: '/impressum',
    title: 'Impressum | SE Handwerk',
    description: 'Impressum und Anbieterkennzeichnung von SE Handwerk, Raum Heilbronn.',
    h1: 'Impressum',
  },
  datenschutz: {
    path: '/datenschutz',
    title: 'Datenschutz | SE Handwerk',
    description: 'Datenschutzerklärung von SE Handwerk — Informationen zum Umgang mit Ihren Daten.',
    h1: 'Datenschutz',
  },
};
