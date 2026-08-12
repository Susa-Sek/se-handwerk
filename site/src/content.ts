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

// Sichtbare, kuratierte Chip-Reihe (aufgeräumt, nicht die volle Liste).
export const regionen = [
  'Heilbronn',
  'Neckarsulm',
  'Weinsberg',
  'Öhringen',
  'Bietigheim-Bissingen',
  'Sinsheim',
];

// Vollständiges Einzugsgebiet – primär für areaServed-JSON-LD (unsichtbar).
// Reihenfolge nach Nähe/Relevanz. Leicht anpassbar.
export const einsatzOrte = [
  'Heilbronn',
  'Neckarsulm',
  'Weinsberg',
  'Öhringen',
  'Bietigheim-Bissingen',
  'Sinsheim',
  'Bad Wimpfen',
  'Eppingen',
  'Lauffen am Neckar',
  'Brackenheim',
  'Bad Rappenau',
  'Obersulm',
  'Bad Friedrichshall',
  'Ilsfeld',
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
  keyword: string; // primäres Ziel-Keyword für Überschriften/SEO
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
    keyword: 'Komplettsanierung',
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
    keyword: 'Boden verlegen',
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
    keyword: 'Trockenbau & Malerarbeiten',
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
    keyword: 'Badsanierung',
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
    keyword: 'Handwerker für Einzelaufträge',
    metaTitle: 'Handwerker Heilbronn für Einzelaufträge & Montage | SE Handwerk',
    metaDescription:
      'Einzelne Handwerksleistungen im Raum Heilbronn: Malerarbeiten, Bodenverlegung, Trockenbau, Möbelmontage und Wohnungsübergabe – zuverlässig und planbar. Jetzt anfragen.',
    h1: 'Handwerker im Raum Heilbronn für Einzelaufträge',
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
  list?: string[]; // optionale Aufzählung nach den Absätzen
  bild?: string; // optionales Inline-Bild nach dem Abschnitt (Symbolbild)
  bildAlt?: string;
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
  kurz: string[]; // "Das Wichtigste in Kürze" — Vorspann-Kernaussagen
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
      'Ich stehe oft daneben, wenn der neue Boden reinkommt – und höre immer dieselbe Frage: Was kostet das jetzt pro Quadratmeter? Hier sind ehrliche Zahlen, ein Rechenbeispiel und die Posten, die auf keinem Online-Rechner stehen.',
    datum: '2026-07-22',
    kategorie: 'Bodenarbeiten',
    lesezeit: '10 Min.',
    bild: 'blog-vinyl.jpg',
    bildAlt: 'Symbolbild: frisch verlegter Vinyl-Designboden in einem hellen Wohnraum',
    kurz: [
      'Vinylboden verlegen kostet als Richtwert etwa 30–70 € pro m² (Material + Arbeit).',
      'Das Material allein liegt bei rund 15–40 €/m², die Verlegung bei 15–30 €/m².',
      'Klick-Vinyl ist günstiger und schneller, verklebtes Vinyl robuster – ideal bei Fußbodenheizung.',
      'Die Untergrundvorbereitung ist der am häufigsten vergessene Kostenpunkt.',
    ],
    relatedLeistung: 'bodenarbeiten',
    sections: [
      {
        h2: 'Was kostet Vinylboden verlegen pro m²?',
        paras: [
          'Kurz gesagt: Material und Arbeit zusammen liegen meist zwischen 30 und 70 Euro pro Quadratmeter. Klingt nach viel Spielraum – ist es auch. Drei Dinge machen den Preis: die Qualität des Vinyls, der Zustand des Untergrunds und die Frage, ob geklickt oder verklebt wird.',
          'Die meisten Wohnungen, die ich sehe, landen in der Mitte dieser Spanne. Teuer wird es bei dickem Designboden, bei einem Untergrund, der erst gerichtet werden muss, oder bei einem verwinkelten Grundriss, wo jeder zweite Quadratmeter ein Zuschnitt ist.',
          'Und damit wir uns richtig verstehen: Das sind Marktrichtwerte zur Orientierung, kein Angebot. Preise ändern sich, jede Wohnung ist anders. Was Ihr Boden kostet, weiß ich erst, wenn ich den Raum gesehen habe – dann aber als Festpreis, ohne böse Nachträge.',
        ],
      },
      {
        h2: 'Materialkosten: Was kostet der Vinylboden selbst?',
        paras: [
          'Das reine Material liegt je nach Qualität grob bei 15 bis 40 Euro pro Quadratmeter. Ganz günstige Klick-Vinylböden fangen darunter an, gute Designböden mit dicker Nutzschicht liegen darüber.',
          'Worauf es wirklich ankommt, ist die Nutzschicht – die durchsichtige Deckschicht oben drauf. Für normale Wohnräume reichen je nach Hersteller oft 0,3 bis 0,4 Millimeter. Wollen Sie den Boden vermieten oder stark beanspruchen, würde ich eher zu 0,55 Millimeter und mehr raten. Der Boden steckt dann Kratzer und Möbelrücken erfahrungsgemäß besser weg.',
          'Ein Punkt, den viele nicht auf dem Schirm haben: Vollflächig zu verklebendes Vinyl ist als Material oft günstiger als Klick-Ware. Dafür holt man sich den Preis über den höheren Arbeitsaufwand wieder rein.',
        ],
      },
      {
        h2: 'Verlegekosten: Was kostet die Arbeit?',
        paras: [
          'Für die reine Verlegung durch einen Fachbetrieb rechnen Sie noch einmal grob 15 bis 30 Euro pro Quadratmeter obendrauf. Klick-Vinyl geht schneller und ist damit meist günstiger, vollflächiges Verkleben ist Handarbeit und liegt am oberen Ende.',
          'Sobald der Untergrund vorbereitet werden muss – spachteln, ausgleichen, grundieren –, steigt der Arbeitsanteil spürbar. Genau hier trennt sich saubere Arbeit von Pfusch. Ein ebener, trockener Untergrund ist die Grundlage dafür, dass der Boden bei fachgerechter Ausführung lange schön bleibt.',
        ],
      },
      {
        h2: 'Klick-Vinyl oder vollflächig verkleben?',
        paras: [
          'Klick-Vinyl wird schwimmend verlegt, ist schnell fertig und meist günstiger. Für Wohn- und Schlafräume und die klassische Mietwohnung ist das in der Regel die richtige Wahl – und später wieder aufnehmen lässt es sich auch leichter.',
          'Vollflächig verklebtes Vinyl sitzt fest und bewegt sich nicht. Das ist sinnvoll bei großen zusammenhängenden Flächen, bei Fußbodenheizung und überall dort, wo viel los ist – Flure, Gewerberäume, Treppenhäuser.',
          'Meine Faustregel: Schnell fertig und vermietbar? Klick. Maximale Robustheit oder Fußbodenheizung? Verkleben. Beides hat seine Berechtigung – pauschal besser ist keins von beiden.',
        ],
      },
      {
        h2: 'Untergrundvorbereitung – der Posten, den alle unterschätzen',
        paras: [
          'Wenn Vinyl später Ärger macht, liegt es fast nie am Boden selbst, sondern am Untergrund. Unebenheiten drücken sich mit der Zeit durch. Restfeuchte im Estrich kann zu Schäden führen. Loser Altbelag verhindert eine saubere Verlegung.',
          'Je nach Zustand kommen Ausgleichsmasse, Grundierung, das Entfernen alter Beläge oder eine Feuchtemessung dazu. Das kostet extra – ist aber nichts, woran man sparen sollte. Der Untergrund entscheidet mit darüber, wie lange der neue Boden hält.',
        ],
      },
      {
        h2: 'Diese Zusatzkosten kommen oft dazu',
        paras: [
          'Jetzt kommen die Posten, die auf keinem Online-Rechner auftauchen – und am Ende trotzdem auf der Rechnung stehen:',
        ],
        list: [
          'Rückbau und Entsorgung des alten Bodens',
          'Trittschalldämmung',
          'Sockelleisten sowie Übergangs- und Abschlussprofile',
          'Kürzen von Türblättern, weil der neue Aufbau höher ist',
        ],
        bild: 'blog-detail.jpg',
        bildAlt: 'Symbolbild: saubere Sockelleiste am Übergang zum neuen Boden',
      },
      {
        h2: 'Wie lange hält ein Vinylboden?',
        paras: [
          'Eine pauschale Zahl nennt Ihnen niemand seriös – das hängt an Nutzschicht, Beanspruchung und Pflege. Als grobe Orientierung: Ein gut gewählter Vinylboden hält im Wohnbereich viele Jahre, in Mietwohnungen übersteht er in der Regel mehrere Mieterwechsel.',
          'Der Rest ist Handwerk: passende Nutzschicht plus saubere Verlegung auf gutem Untergrund. Billiges Material auf schlechtem Untergrund spart heute und kostet oft in wenigen Jahren doppelt.',
        ],
      },
      {
        h2: 'Rechenbeispiel: Vinylboden für eine 70-m²-Wohnung',
        paras: [
          'Rechnen wir grob durch – rein zur Orientierung, ausdrücklich kein Angebot: Bei angenommenen 45 Euro pro Quadratmeter für verlegten Vinylboden inklusive der üblichen Nebenarbeiten landet eine 70-Quadratmeter-Wohnung bei etwa 3.150 Euro.',
          'Bei einfachem Material und wenig Untergrundaufwand kann es deutlich darunter liegen, bei hochwertigem Designboden und einem Untergrund, der erst gerichtet werden muss, entsprechend darüber. Den belastbaren Preis für Ihre Wohnung gibt es erst nach dem Blick vor Ort.',
        ],
      },
      {
        h2: 'Sparen ja – aber an der richtigen Stelle',
        paras: [
          'Sparen können Sie beim Material: Es muss nicht der teuerste Designboden sein, eine solide mittlere Qualität reicht für die meisten Wohnungen. Und wer mehrere Räume auf einmal machen lässt, spart pro Quadratmeter, weil An- und Abfahrt sowie Rüstzeit nur einmal anfallen.',
          'Nicht sparen sollten Sie an der Untergrundvorbereitung und an der Verlegung. Das ist die Stelle, an der schlechte Arbeit erst später auffällt – und dann richtig teuer wird.',
        ],
      },
      {
        h2: 'Vinylboden verlegen lassen im Raum Heilbronn',
        paras: [
          'Wir verlegen Vinyl-, Design- und Klickböden im gesamten Raum Heilbronn – inklusive Untergrundvorbereitung, Trittschalldämmung und Sockelleisten. Sauber verlegt, fair kalkuliert und mit verbindlichem Festpreis vor Baubeginn.',
          'Für Kapitalanleger und Vermieter übernehmen wir auf Wunsch die ganze Wohnung: Boden, Malerarbeiten und Übergabe im selben Zug, mit einem einzigen Ansprechpartner. Sie sagen uns, bis wann es fertig sein soll – wir sagen ehrlich, ob das realistisch ist.',
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
      'Laminat oder Vinyl – die Frage bekomme ich auf fast jeder Baustelle. Beide sehen gut aus, beide sind bezahlbar. Aber bei Wasser, Fußbodenheizung und Vermietung trennt sich die Spreu vom Weizen. Hier ist mein ehrlicher Vergleich.',
    datum: '2026-07-22',
    kategorie: 'Bodenarbeiten',
    lesezeit: '8 Min.',
    bild: 'blog-laminat-vinyl.jpg',
    bildAlt: 'Symbolbild: Laminat- und Vinyl-Boden im Vergleich',
    kurz: [
      'Vinyl ist wasserfest und leise – die robustere Wahl für Vermietung und Feuchträume.',
      'Laminat ist etwas günstiger, quillt aber bei stehendem Wasser auf.',
      'Beide gehen auf Fußbodenheizung – bei Laminat auf ausdrückliche Freigabe achten.',
      'Wichtiger als der Materialtyp: die Produktqualität und ein ebener Untergrund.',
    ],
    relatedLeistung: 'bodenarbeiten',
    sections: [
      {
        h2: 'Laminat oder Vinyl – der schnelle Überblick',
        paras: [
          'Laminat ist im Kern Holz: eine Trägerplatte mit aufgedruckter Dekorschicht. Warm anzusehen, günstig zu haben. Vinyl, oft als Designboden verkauft, ist Kunststoff – elastischer, leiser beim Gehen und deutlich unempfindlicher gegenüber Feuchtigkeit.',
          'Ehrlich gesagt: Für die meisten Wohnungen, die ich sehe, ist Vinyl heute die robustere Wahl. Laminat hat trotzdem seine Berechtigung – nämlich da, wo es trocken bleibt und jeder Euro zählt.',
        ],
      },
      {
        h2: 'Aufbau und Material: Woraus bestehen die Böden?',
        paras: [
          'Laminat besteht aus einer HDF-Trägerplatte, der Dekorschicht und einem transparenten Overlay als Schutz. Das macht es hart und trittfest – aber die Trägerplatte ist Holz, und Holz reagiert nun mal auf stehendes Wasser.',
          'Vinyl gibt es als flexiblen Kunststoffboden oder als Rigid- beziehungsweise SPC-Variante mit mineralischem Trägerkern. Die Rigid-Böden sind besonders formstabil und je nach Produkt hoch feuchtigkeitsbeständig – und fühlen sich trotzdem fußwarm an.',
        ],
      },
      {
        h2: 'Wasserfestigkeit: der wichtigste Unterschied',
        paras: [
          'Hier trennen sich die beiden am deutlichsten. Vinyl verträgt Feuchtigkeit sehr gut; viele Produkte sind laut Hersteller sogar für Küche und Bad freigegeben. Verschüttetes Wasser ist normalerweise kein Problem, solange es nicht tagelang in den Fugen steht.',
          'Laminat dagegen quillt bei stehendem Wasser an den Kanten auf und ist dann meist nicht mehr zu retten. In echten Feuchträumen würde ich davon abraten. Es gibt inzwischen feuchtraumgeeignete Laminate – da lohnt vorher der Blick ins Datenblatt.',
          'Für die Vermietung spricht das eher für Vinyl: Es verzeiht Missgeschicke und sieht auch nach mehreren Mietern noch ordentlich aus.',
        ],
      },
      {
        h2: 'Fußbodenheizung: Was ist geeignet?',
        paras: [
          'Beide Böden lassen sich grundsätzlich auf einer Fußbodenheizung verlegen – vorausgesetzt, der Hersteller gibt das Produkt dafür frei und der Wärmedurchlasswiderstand ist gering genug. Der Blick ins Datenblatt ist hier Pflicht, kein Kann.',
          'Vinyl, besonders vollflächig verklebt, gibt die Wärme gut weiter. Bei Laminat achten Sie auf ein ausdrücklich für Fußbodenheizung freigegebenes Produkt und die passende Unterlage.',
        ],
      },
      {
        h2: 'Optik, Haptik und Trittschall',
        paras: [
          'Laminat wirkt beim Gehen oft etwas härter und lauter, Vinyl fußwarm und leise. Bei der Optik nehmen sich beide inzwischen wenig – gute Holz- und Steindekore sind von echtem Parkett kaum zu unterscheiden.',
          'In Mehrfamilienhäusern ist die passende Trittschalldämmung ohnehin Pflicht. Damit lassen sich beide Böden angenehm leise verlegen, und die Nachbarn unter Ihnen bleiben entspannt.',
        ],
        bild: 'nachher.jpg',
        bildAlt: 'Symbolbild: heller Wohnraum mit modernem Holzoptik-Boden',
      },
      {
        h2: 'Strapazierfähigkeit und Lebensdauer',
        paras: [
          'Laminat ist kratz- und druckfest, reagiert aber empfindlich auf Nässe und lässt sich kaum ausbessern. Vinyl steckt Feuchtigkeit und Dellen besser weg, kann dafür bei scharfen Gegenständen eher einschneiden.',
          'Über die Nutzungsdauer gerechnet liegen beide bei guter Qualität nah beieinander. Eine feste Jahreszahl verspricht Ihnen niemand seriös – wichtiger als der Materialtyp ist die Qualität des konkreten Produkts und ein fachgerecht vorbereiteter Untergrund.',
        ],
      },
      {
        h2: 'Kosten im Vergleich',
        paras: [
          'Beim Material ist Laminat meist etwas günstiger, Vinyl liegt leicht darüber. Über die Lebensdauer ist der Unterschied überschaubar. Am Preis drehen ohnehin weniger der Materialtyp als die Qualität und der Zustand des Untergrunds.',
          'Konkrete Zahlen zu Material und Verlegung finden Sie in unserem Beitrag zu den Kosten fürs Vinylboden verlegen – die Größenordnung lässt sich gut auf Laminat übertragen.',
        ],
      },
      {
        h2: 'Laminat oder Vinyl für die Vermietung?',
        paras: [
          'Für Mietwohnungen rate ich in den meisten Fällen zu Vinyl. Es hält Feuchtigkeit, häufiges Wischen und Mieterwechsel besser aus – und erspart Ihnen über die Jahre Instandhaltung.',
          'Laminat kann trotzdem die richtige Wahl sein, wenn das Budget sehr eng ist und die Räume trocken bleiben, etwa Schlaf- und Wohnräume ohne Wasseranschluss.',
        ],
      },
      {
        h2: 'Fazit: kurze Entscheidungshilfe',
        paras: [
          'Vermietung, Feuchträume, Fußbodenheizung, viel Betrieb: Vinyl. Trockener Wohnraum mit knappem Budget: Laminat kann passen. So einfach ist es meistens.',
          'Unsicher, was zu Ihrem Objekt im Raum Heilbronn passt? Wir schauen bei der Aufnahme vor Ort ehrlich drauf, empfehlen nur, was wirklich sinnvoll ist – und verlegen beides fachgerecht, inklusive Untergrund und Sockelleisten.',
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
      'Ich habe genug Baustellen gesehen, die aus dem Ruder liefen – fast immer war es dieselbe Ursache: die falsche Reihenfolge. So läuft eine Sanierung vor der Vermietung wirklich sauber, mit Reihenfolge, Kosten und einem ehrlichen Zeitplan.',
    datum: '2026-07-22',
    kategorie: 'Sanierung',
    lesezeit: '9 Min.',
    bild: 'blog-sanierung.jpg',
    bildAlt: 'Symbolbild: frisch sanierte, bezugsfertige Wohnung',
    kurz: [
      'Die richtige Reihenfolge der Gewerke spart mehr Zeit als jedes einzelne Gewerk zu beschleunigen.',
      'Faustregel: von oben nach unten, von grob nach fein – der Boden kommt bewusst spät.',
      'Den größten Effekt auf die Miete haben Wände, Boden und Bad.',
      'Ein Festpreis vor Baubeginn und ein realistischer Zeitplan mit Puffer schützen vor Überraschungen.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Warum die Reihenfolge über die Bauzeit entscheidet',
        paras: [
          'Wenn eine Sanierung aus dem Ruder läuft, liegt es selten an einem einzelnen Handwerker. Es liegt an der Koordination. Der Bodenleger kommt, aber der Estrich ist noch feucht. Der Maler steht vor der Tür, während der Trockenbau noch staubt. Und plötzlich steht alles.',
          'Ich habe Wohnungen gesehen, die acht Wochen dauern sollten und am Ende ein halbes Jahr gebraucht haben – nicht wegen schlechter Handwerker, sondern weil niemand die Reihenfolge im Griff hatte.',
          'Die richtige Reihenfolge spart mehr Zeit als jeder Handwerker, der schneller arbeitet. Und wer vor der Vermietung saniert, rechnet gegen die Uhr: Jede Woche Leerstand ist Miete, die niemand bezahlt.',
        ],
      },
      {
        h2: 'Die richtige Reihenfolge – Schritt für Schritt',
        paras: [
          'Grob gilt diese Reihenfolge, damit die Gewerke sauber ineinandergreifen, statt aufeinander zu warten:',
        ],
        list: [
          'Rückbau und Entkernung – alter Boden, Tapeten und defekte Einbauten raus, inklusive Entsorgung.',
          'Roharbeiten – Trockenbau sowie Elektro- und Sanitärleitungen, solange die Wände offen sind.',
          'Putz, Spachtel und Estrich – inklusive der nötigen Trocknungszeit.',
          'Fliesen- und Badarbeiten.',
          'Bodenbeläge wie Vinyl, Laminat oder Parkett.',
          'Malerarbeiten und Feinschliff.',
          'Montagen, Endreinigung und Übergabe – alles Empfindliche zum Schluss.',
        ],
        bild: 'leistung-komplett.jpg',
        bildAlt: 'Symbolbild: Wohnung mitten in der Sanierung',
      },
      {
        h2: 'Was zuerst, was zuletzt?',
        paras: [
          'Zwei Faustregeln reichen eigentlich: von oben nach unten und von grob nach fein. Erst Decke und Wände, dann der Boden. Erst das Staubige, dann das Empfindliche. Malerarbeiten kurz vor Schluss.',
          'Der Boden kommt bewusst spät, damit ihn kein nachfolgendes Gewerk mehr verkratzt. Wer diese Reihenfolge umdreht, zahlt am Ende oft doppelt – einmal für die Arbeit und einmal für die Ausbesserung.',
        ],
      },
      {
        h2: 'Welche Arbeiten lohnen sich vor der Vermietung wirklich?',
        paras: [
          'Nicht jede Wohnung braucht die große Kernsanierung. Den größten Effekt auf Vermietbarkeit und Miete haben nach meiner Erfahrung drei Dinge: frische Wände, ein neuer, pflegeleichter Boden und ein zeitgemäßes Bad.',
          'Die entscheiden über den ersten Eindruck bei der Besichtigung. Küche, Elektrik und Fenster sind je nach Zustand weitere Hebel, aber teurer – hier lohnt eine ehrliche Abwägung zwischen Aufwand und Mietwirkung.',
          'Ein Hinweis noch: Was für eine Vermietung rechtlich vorgeschrieben ist – etwa bei Elektrik oder Rauchmeldern – klären Sie im Zweifel mit einem Fachbetrieb oder Ihrer Hausverwaltung. Das ist kein Bereich für Bauchgefühl.',
        ],
      },
      {
        h2: 'Kostenfaktoren im Überblick',
        paras: [
          'Was eine Sanierung kostet, hängt von Zustand, Größe und Ausstattung ab – seriös lässt sich das erst nach einer Aufnahme sagen. Der größte Hebel ist meist das Bad, dann Boden und Malerarbeiten. Auch Umfang des Rückbaus und Entsorgung schlagen zu Buche.',
          'Ein verbindlicher Festpreis vor Baubeginn schützt weitgehend vor Nachträgen aus dem Nichts – besonders wichtig, wenn Sie als Kapitalanleger mit spitzer Feder rechnen und die Rendite stimmen soll.',
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
          'Eine typische Wohnungssanierung dauert je nach Umfang einige Wochen. Seriös ist ein Taktplan mit Puffer – auf Baustellen kann sich immer etwas verschieben, sei es durch Trocknungszeiten oder eine Lieferung, die hängt.',
          'Für mich zählt am Ende eine Sache: Transparenz. Verschiebt sich etwas, sollten Sie es zuerst erfahren, nicht zuletzt. Ein ehrlicher Termin, der hält, ist mehr wert als ein schöngerechneter, der platzt.',
        ],
      },
      {
        h2: 'Häufige Fehler bei der Sanierung vor Vermietung',
        paras: [
          'Wer alle Gewerke einzeln vergibt, wird schnell zum unbezahlten Bauleiter – mit fünf Ansprechpartnern, die aufeinander warten. Diese Fehler kosten am meisten:',
        ],
        list: [
          'Gewerke in der falschen Reihenfolge beauftragen.',
          'Mehrere Firmen selbst koordinieren müssen.',
          'An der Untergrundvorbereitung sparen.',
          'Ohne verbindlichen Festpreis starten.',
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
  {
    slug: 'badsanierung-kosten',
    metaTitle: 'Badsanierung Kosten: Was ein neues Bad kostet 2026 | SE Handwerk',
    metaDescription:
      'Was kostet eine Badsanierung? Richtwerte für kleines und großes Bad, die größten Kostentreiber, wo Sparen sich lohnt – und warum ein Festpreis vor bösen Überraschungen schützt.',
    title: 'Badsanierung Kosten: Was ein neues Bad wirklich kostet',
    excerpt:
      'Kein Gewerk sprengt das Budget so gern wie das Bad. Ich erkläre, was ein neues Bad realistisch kostet, wo das Geld hingeht – und an welcher Stelle Sparen sich später rächt.',
    datum: '2026-07-24',
    kategorie: 'Bad & Sanitär',
    lesezeit: '7 Min.',
    bild: 'blog-bad.jpg',
    bildAlt: 'Symbolbild: frisch saniertes modernes Badezimmer',
    kurz: [
      'Eine Badsanierung kostet je nach Größe und Ausstattung grob 8.000 bis 25.000 Euro.',
      'Die größten Kostentreiber sind Fliesen, Sanitärobjekte und das Verlegen von Leitungen.',
      'Ein kleines Gäste-WC ist deutlich günstiger als ein Familienbad mit Wanne und Dusche.',
      'An der Abdichtung zu sparen ist der teuerste Fehler überhaupt.',
    ],
    relatedLeistung: 'bad-sanitaer',
    sections: [
      {
        h2: 'Was kostet eine Badsanierung?',
        paras: [
          'Fangen wir mit der Zahl an, die alle suchen: Ein komplett saniertes Bad kostet grob zwischen 8.000 und 25.000 Euro. Ein kleines Gäste-WC liegt darunter, ein großes Familienbad mit Wanne, bodengleicher Dusche und schönen Fliesen darüber.',
          'Warum die Spanne so groß ist? Weil im Bad mehr Gewerke zusammenkommen als in jedem anderen Raum – Rückbau, Sanitär, Fliesen, Trockenbau, Maler. Jedes davon dreht an der Rechnung.',
          'Wie immer gilt: Richtwerte, kein Angebot. Den echten Preis gibt es nach der Aufnahme vor Ort, dann als Festpreis.',
        ],
      },
      {
        h2: 'Die größten Kostentreiber im Bad',
        paras: [
          'Wenn ein Bad teuer wird, dann meist an diesen Stellen:',
        ],
        list: [
          'Fliesen – Material und Verlegung, besonders bei großformatigen Platten.',
          'Sanitärobjekte – WC, Waschtisch, Dusche, Armaturen; hier ist nach oben viel Luft.',
          'Leitungen verlegen – neue Wasser- und Abflussleitungen sind reine Handarbeit.',
          'Bodengleiche Dusche – schön, aber aufwändiger als eine einfache Duschtasse.',
        ],
        bild: 'leistung-bad.jpg',
        bildAlt: 'Symbolbild: Detail eines modernen Bades',
      },
      {
        h2: 'Kleines Bad, großes Bad – wo liegt der Unterschied?',
        paras: [
          'Ein 4-Quadratmeter-Gäste-WC und ein 12-Quadratmeter-Familienbad sind zwei verschiedene Baustellen. Nicht nur wegen der Fläche – im großen Bad kommen Wanne, ein zweites Becken und viel mehr Wandfläche zum Fliesen dazu.',
          'Faustregel: Je mehr Objekte und je mehr gefliste Wand, desto teurer. Wer am Grundriss nichts ändert und die Leitungen liegen lässt, spart am meisten.',
        ],
      },
      {
        h2: 'Wo sich Sparen lohnt – und wo nicht',
        paras: [
          'Sparen können Sie bei der Ausstattung. Es muss nicht die Designer-Armatur sein; gute Standardserien halten genauso lange. Und wer den Grundriss beibehält, spart sich die teuren Leitungsarbeiten.',
          'Nicht sparen sollten Sie an der Abdichtung und der Verarbeitung. Ein undichtes Bad ist der teuerste Fehler, den man machen kann – der Schaden zeigt sich erst Jahre später, meistens in der Wohnung darunter.',
        ],
      },
      {
        h2: 'Badsanierung im Raum Heilbronn – alles aus einer Hand',
        paras: [
          'Wir sanieren Bäder im Raum Heilbronn komplett: Rückbau, Fliesen, koordinierte Sanitärarbeiten, Trockenbau und Maler – ein Ansprechpartner, ein Festpreis. Sie müssen nicht fünf Firmen hinterhertelefonieren.',
          'Bei der Aufnahme sagen wir ehrlich, was sinnvoll ist und was nicht – und was es kostet, bevor der erste Fliesenhammer fällt.',
        ],
      },
    ],
  },
  {
    slug: 'trockenbau-kosten',
    metaTitle: 'Trockenbau Kosten pro m²: Preise für Wände & Decken 2026 | SE Handwerk',
    metaDescription:
      'Was kostet Trockenbau pro m²? Preise für Trennwände, Vorwände und abgehängte Decken, was den Preis treibt und wann sich Trockenbau lohnt – vom Handwerksbetrieb erklärt.',
    title: 'Trockenbau Kosten pro m²: Wände und Decken im Überblick',
    excerpt:
      'Eine Wand versetzen, ohne die Statik anzufassen? Genau dafür ist Trockenbau da. Ich zeige, was Trennwände, Vorwände und abgehängte Decken pro Quadratmeter kosten.',
    datum: '2026-07-24',
    kategorie: 'Wand & Decke',
    lesezeit: '6 Min.',
    bild: 'blog-trockenbau.jpg',
    bildAlt: 'Symbolbild: Trockenbau-Ständerwand in der Renovierung',
    kurz: [
      'Eine einfache Trockenbauwand kostet grob 40 bis 80 Euro pro m², fertig verspachtelt.',
      'Abgehängte Decken liegen meist bei rund 40 bis 70 Euro pro m².',
      'Dämmung, doppelte Beplankung und Feuchtraumplatten treiben den Preis nach oben.',
      'Trockenbau teilt Räume neu auf, ohne in die Statik einzugreifen.',
    ],
    relatedLeistung: 'wand-decke',
    sections: [
      {
        h2: 'Was kostet Trockenbau pro m²?',
        paras: [
          'Für eine einfache, fertig verspachtelte Trockenbauwand rechnen Sie grob 40 bis 80 Euro pro Quadratmeter. Eine abgehängte Decke liegt meist bei 40 bis 70 Euro pro Quadratmeter.',
          'Das ist Material plus Arbeit. Nach oben geht es, sobald Dämmung, doppelte Beplankung oder Feuchtraumplatten dazukommen. Nach unten, wenn es eine simple, gerade Wand ohne Extras ist.',
          'Auch hier: Richtwerte, kein Angebot. Den festen Preis gibt es nach dem Blick vor Ort.',
        ],
      },
      {
        h2: 'Was den Preis beim Trockenbau treibt',
        paras: [
          'Trockenbau klingt simpel, ist im Detail aber unterschiedlich aufwändig. Diese Faktoren machen den Unterschied:',
        ],
        list: [
          'Einfache oder doppelte Beplankung – für mehr Schallschutz und Stabilität.',
          'Dämmung in der Wand, für Schall oder Wärme.',
          'Feuchtraumplatten, wenn es ins Bad geht.',
          'Aussparungen für Türen, Nischen und Technik.',
          'Spachtelqualität: Q2 reicht unter Fliesen, unter Malerfarbe braucht es Q3 oder Q4.',
        ],
        bild: 'leistung-wand.jpg',
        bildAlt: 'Symbolbild: frisch verspachtelte Wand',
      },
      {
        h2: 'Wann sich Trockenbau lohnt',
        paras: [
          'Der große Vorteil: Mit Trockenbau teilen Sie Räume neu auf, ohne eine tragende Wand anzufassen. Aus einem großen Zimmer werden zwei, eine Vorwand versteckt Leitungen, eine abgehängte Decke schluckt Kabel und Technik.',
          'Das geht schnell, staubarm und ohne die wochenlangen Trocknungszeiten des gemauerten Baus. Für Mietwohnungen und Umnutzungen ist das oft die cleverste Lösung.',
        ],
      },
      {
        h2: 'Trockenbau und Malerarbeiten im Raum Heilbronn',
        paras: [
          'Wir übernehmen Trockenbau, Ständerwände und abgehängte Decken im Raum Heilbronn – und die Malerarbeiten gleich mit. So passt die Spachtelqualität zur späteren Farbe, und niemand schiebt die Verantwortung auf den anderen.',
          'Ob als Teil einer Sanierung oder als einzelner Auftrag: Sie bekommen einen Ansprechpartner und einen Festpreis.',
        ],
      },
    ],
  },
  {
    slug: 'sanierung-raum-heilbronn',
    metaTitle: 'Sanierung im Raum Heilbronn: Ablauf, Kosten & Ansprechpartner | SE Handwerk',
    metaDescription:
      'Sanierung im Raum Heilbronn – von Neckarsulm bis Stuttgart: Ablauf, Kosten, regionale Besonderheiten und warum ein Ansprechpartner vor Ort Zeit und Nerven spart.',
    title: 'Sanierung im Raum Heilbronn: Was Eigentümer wissen sollten',
    excerpt:
      'Ob Altbau in der Heilbronner Innenstadt oder Anlegerwohnung in Neckarsulm – regional gibt es Besonderheiten, die eine Sanierung leichter oder schwerer machen. Ein Überblick aus der Praxis.',
    datum: '2026-07-24',
    kategorie: 'Sanierung',
    lesezeit: '7 Min.',
    bild: 'nachher.jpg',
    bildAlt: 'Symbolbild: sanierter Wohnraum im Raum Heilbronn',
    kurz: [
      'Wir sanieren im gesamten Raum Heilbronn – von Neckarsulm über Sinsheim bis Stuttgart.',
      'Gerade auswärtige Eigentümer und Kapitalanleger profitieren von einem Ansprechpartner vor Ort.',
      'Der Altbaubestand der Region bringt eigene Themen mit: Feuchte, alte Leitungen, schiefe Wände.',
      'Ein Festpreis und regelmäßige Updates ersetzen die ständige Anwesenheit auf der Baustelle.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Sanieren im Raum Heilbronn – die Ausgangslage',
        paras: [
          'Der Raum Heilbronn ist bunt gemischt: gründerzeitlicher Altbau, Nachkriegsbauten, dazu viele Anlegerwohnungen aus den Siebzigern und Achtzigern. Jede Epoche bringt ihre eigenen Überraschungen mit.',
          'Im Altbau sind es oft Feuchte im Keller, alte Elektrik und Wände, die nicht im Lot stehen. In den jüngeren Bauten geht es meist um veraltete Bäder und Böden. Wer das kennt, plant von Anfang an realistischer.',
        ],
      },
      {
        h2: 'Von Neckarsulm bis Stuttgart – wo wir arbeiten',
        paras: [
          'Wir sind im gesamten Raum Heilbronn und Umgebung unterwegs: Heilbronn, Neckarsulm, Sinsheim, Bad Wimpfen, Eppingen und bis in den Großraum Stuttgart. Die kurzen Wege sind kein Nebendetail – sie halten die Baustelle in Bewegung.',
          'Ein Handwerker aus der Region ist schneller da, wenn eine Entscheidung ansteht. Das klingt banal, entscheidet aber oft über eine Woche mehr oder weniger Bauzeit.',
        ],
        bild: 'bento-invest.jpg',
        bildAlt: 'Symbolbild: sanierte Wohnung bei Dämmerung',
      },
      {
        h2: 'Warum ein Ansprechpartner vor Ort Gold wert ist',
        paras: [
          'Viele unserer Kunden wohnen nicht in Heilbronn. Kapitalanleger aus München, Erben aus Hamburg, Eigentümer, die beruflich eingespannt sind. Für sie wäre die Sanierung aus der Ferne ein Vollzeitjob – wenn sie ihn selbst machen müssten.',
          'Wir übernehmen die Steuerung vor Ort, koordinieren alle Gewerke und schicken regelmäßig Updates mit Fotos. Sie müssen nicht anreisen, um zu wissen, wo Ihr Projekt steht.',
        ],
      },
      {
        h2: 'Ablauf und Kosten – kurz gesagt',
        paras: [
          'Der Ablauf ist immer gleich: Aufnahme vor Ort, ein aufgeschlüsseltes Festpreis-Angebot, dann die Ausführung nach einem realistischen Taktplan. Verschiebt sich etwas, erfahren Sie es zuerst von uns.',
          'Was es kostet, hängt vom Objekt ab – eine Anlegerwohnung, die vermietbar werden soll, ist etwas anderes als die Kernsanierung eines Altbaus. Konkrete Zahlen zu einzelnen Gewerken finden Sie in unseren anderen Ratgebern.',
        ],
      },
      {
        h2: 'Ihr Sanierungspartner im Raum Heilbronn',
        paras: [
          'Ob vermietbar machen, verkaufsfertig herrichten oder das eigene Zuhause modernisieren: Wir übernehmen die Sanierung im Raum Heilbronn komplett – alle Gewerke, ein Ansprechpartner, ein Festpreis.',
          'Erzählen Sie uns kurz von Ihrem Objekt. Wir sehen es uns an und sagen ehrlich, was möglich ist.',
        ],
      },
    ],
  },
  {
    slug: 'generalunternehmer-sanierung',
    metaTitle: 'Generalunternehmer für die Sanierung: Vorteile & Kosten | SE Handwerk',
    metaDescription:
      'Generalunternehmer für die Sanierung im Raum Heilbronn: alle Gewerke aus einer Hand, ein Ansprechpartner, ein Festpreis. Vorteile, Kosten und wann es sich lohnt.',
    title: 'Generalunternehmer für die Sanierung: Lohnt sich alles aus einer Hand?',
    excerpt:
      'Fünf Firmen, fünf Rechnungen, fünf Ausreden – oder ein Ansprechpartner, der den Kopf hinhält. Ich erkläre, was ein Generalunternehmer bei der Sanierung wirklich bringt und wann er sich lohnt.',
    datum: '2026-07-28',
    kategorie: 'Sanierung',
    lesezeit: '7 Min.',
    bild: 'blog-gu.jpg',
    bildAlt: 'Symbolbild: fertig sanierte Wohnung – das Ergebnis einer koordinierten Sanierung',
    kurz: [
      'Ein Generalunternehmer koordiniert alle Gewerke und ist Ihr einziger Ansprechpartner.',
      'Sie bekommen einen Festpreis und einen Zeitplan statt fünf Einzelrechnungen.',
      'Besonders sinnvoll für Kapitalanleger, Erben und alle, die nicht vor Ort sind.',
      'Teurer ist das oft nicht – weil Koordination, Leerlauf und Wartezeiten wegfallen.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Was macht ein Generalunternehmer bei der Sanierung?',
        paras: [
          'Kurz gesagt: Ein Generalunternehmer nimmt Ihnen die Baustelle komplett ab. Er plant den Ablauf, beauftragt und koordiniert alle Gewerke – Boden, Trockenbau, Bad, Maler – und steht am Ende für das Ergebnis gerade. Sie haben einen Vertrag und einen Ansprechpartner statt fünf.',
          'Bei uns heißt das: Sie rufen uns an, nicht den Bodenleger, den Maler und den Fliesenleger nacheinander. Wir halten die Fäden zusammen, Sie behalten den Überblick.',
        ],
      },
      {
        h2: 'Der Unterschied zur Einzelvergabe',
        paras: [
          'Bei der Einzelvergabe suchen Sie jeden Handwerker selbst, holen Angebote ein, stimmen Termine ab und passen auf, dass keiner dem anderen im Weg steht. Klingt machbar – bis der Estrich noch feucht ist und der Bodenleger schon vor der Tür steht.',
          'Beim Generalunternehmer liegt genau diese Koordination bei einem. Das ist der eigentliche Unterschied: nicht die einzelne Handwerksleistung, sondern wer den Kopf hinhält, wenn Gewerke aufeinandertreffen.',
        ],
        bild: 'leistung-komplett.jpg',
        bildAlt: 'Symbolbild: koordinierte Baustelle in der Sanierung',
      },
      {
        h2: 'Die Vorteile – ehrlich betrachtet',
        paras: [
          'Ein Generalunternehmer ist kein Selbstzweck. Aber diese Punkte nehmen Ihnen spürbar Arbeit ab:',
        ],
        list: [
          'Ein Ansprechpartner für alles – kein Hin und Her zwischen Firmen.',
          'Ein verbindlicher Festpreis statt fünf Einzelrechnungen.',
          'Ein abgestimmter Zeitplan, in dem die Gewerke ineinandergreifen.',
          'Klare Verantwortung: Bei Fragen oder Mängeln gibt es keine Schnittstellen-Ausreden.',
        ],
      },
      {
        h2: 'Wann sich ein Generalunternehmer besonders lohnt',
        paras: [
          'Für alle, die nicht selbst auf der Baustelle stehen können oder wollen. Kapitalanleger, die mehrere Objekte betreuen. Erben, die eine Wohnung aus der Ferne herrichten. Berufstätige, die keine Zeit haben, drei Firmen zu koordinieren.',
          'Wer dagegen handwerklich fit ist, Zeit hat und selbst gern koordiniert, kann mit Einzelvergabe glücklich werden. Ehrlich ist ehrlich.',
        ],
      },
      {
        h2: 'Kostet ein Generalunternehmer mehr?',
        paras: [
          'Der verbreitete Gedanke ist: Einer, der alles steuert, schlägt seinen Aufwand auf. Stimmt zum Teil – dafür fallen Leerlauf, Wartezeiten und die Fehler weg, die zwischen schlecht abgestimmten Firmen entstehen.',
          'Ob es unterm Strich teurer oder günstiger ist, hängt vom Projekt ab und lässt sich seriös erst nach einer Aufnahme sagen. Was Sie in jedem Fall bekommen: einen Festpreis, mit dem Sie planen können.',
        ],
      },
      {
        h2: 'Sanierung aus einer Hand im Raum Heilbronn',
        paras: [
          'Genau das machen wir: Wir übernehmen Ihre Sanierung im Raum Heilbronn als Ihr Ansprechpartner, koordinieren alle Gewerke und liefern ein fertiges Ergebnis – vermietbar oder verkaufsfertig, wie Sie es brauchen.',
          'Erzählen Sie uns von Ihrem Objekt. Wir sehen es uns an und sagen ehrlich, was aus einer Hand sinnvoll ist und was nicht.',
        ],
      },
    ],
  },
  {
    slug: 'sanieren-im-sommer',
    metaTitle: 'Sanieren im Sommer: Warum die warme Jahreszeit ideal ist | SE Handwerk',
    metaDescription:
      'Sanieren im Sommer: Estrich und Farbe trocknen schneller, durchgehend lüften, kürzere Bauzeit. Warum Sommer und Spätsommer gute Monate für die Renovierung sind.',
    title: 'Sanieren im Sommer: Die unterschätzte beste Jahreszeit',
    excerpt:
      'Viele warten mit der Sanierung bis zum Frühjahr – dabei ist der Sommer oft die klügere Wahl. Warme, trockene Luft ist der beste Bautrockner, den es gibt.',
    datum: '2026-07-28',
    kategorie: 'Sanierung',
    lesezeit: '6 Min.',
    bild: 'blog-sommer.jpg',
    bildAlt: 'Symbolbild: heller Raum in der Renovierung mit offenem Fenster im Sommer',
    kurz: [
      'Estrich, Putz und Farbe trocknen im Sommer schneller – das verkürzt die Bauzeit.',
      'Durchgehend lüften und trocknen ist bei warmem, trockenem Wetter problemlos.',
      'Wer über den Sommer saniert, hat die Wohnung im Herbst vermietfertig.',
      'Bei Hitze haben manche Materialien Verarbeitungsgrenzen – das gehört in Fachhände.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Warum der Sommer gut zum Sanieren ist',
        paras: [
          'Der beste Bautrockner der Welt kostet nichts: warme, trockene Sommerluft. Was im Winter tagelang klamm bleibt, ist im Juli oft in einem Bruchteil der Zeit durch. Und Trocknung ist bei fast jeder Sanierung der heimliche Zeitfresser.',
          'Dazu kommt: Man kann durchgehend lüften, ohne die halbe Wohnung auszukühlen. Staub und Gerüche ziehen schneller ab. Für alle Beteiligten ist das angenehmer.',
        ],
      },
      {
        h2: 'Trocknungszeiten: der unterschätzte Zeitfresser',
        paras: [
          'Estrich, Putz, Spachtel und Farbe müssen trocknen, bevor es weitergeht. Diese Wartezeiten stehen in keinem Angebot als eigener Posten, verlängern die Bauzeit aber real.',
          'Im Sommer laufen sie schneller ab. Das heißt nicht, dass man Trocknungszeiten überspringen darf – wer zu früh weitermacht, riskiert Schäden. Aber der Puffer ist kleiner, und der ganze Ablauf wird enger.',
        ],
        bild: 'nachher.jpg',
        bildAlt: 'Symbolbild: heller, frisch sanierter Raum',
      },
      {
        h2: 'Über den Sommer sanieren, im Herbst vermieten',
        paras: [
          'Für Vermieter passt das Timing gut: Wer im Sommer saniert, hat die Wohnung im Herbst fertig – rechtzeitig zur Nachfrage von Studenten, Berufseinsteigern und Umzüglern zum Semester- und Jobstart.',
          'Auch der Spätsommer ist noch ein gutes Fenster, bevor die feuchte, kalte Jahreszeit beginnt und die Trocknung wieder länger dauert.',
        ],
      },
      {
        h2: 'Worauf man im Hochsommer achten sollte',
        paras: [
          'Ganz ohne Haken ist der Sommer nicht. Bei sehr hohen Temperaturen haben manche Materialien und Klebstoffe Verarbeitungsgrenzen – Fliesenkleber zum Beispiel zieht schneller an, manche Produkte sollten nicht in der prallen Sonne verarbeitet werden.',
          'Das ist kein Grund zu warten, sondern einer, es Fachleute machen zu lassen, die die Datenblätter kennen. Wir planen die Reihenfolge so, dass die Hitze mitspielt, statt zu stören.',
        ],
      },
      {
        h2: 'Jetzt sanieren im Raum Heilbronn',
        paras: [
          'Wenn Sie ohnehin dieses Jahr sanieren wollen: Der Sommer ist ein guter Zeitpunkt, nicht der schlechteste. Wir übernehmen die komplette Sanierung im Raum Heilbronn – aus einer Hand, mit einem realistischen Taktplan.',
          'Sagen Sie uns, bis wann es fertig sein soll. Wir sagen ehrlich, ob das über den Sommer machbar ist.',
        ],
      },
    ],
  },
  {
    slug: 'wohnung-sanieren-mieterwechsel',
    metaTitle: 'Wohnung beim Mieterwechsel sanieren: Leerstand clever nutzen | SE Handwerk',
    metaDescription:
      'Mieterwechsel im Sommer? Die Leerstandszeit zwischen zwei Mietern optimal für die Sanierung nutzen: Ablauf, was sich lohnt und wie Sie schnell wieder vermieten.',
    title: 'Wohnung beim Mieterwechsel sanieren: Leerstand clever nutzen',
    excerpt:
      'Der Sommer ist Umzugszeit – und damit die beste Gelegenheit, eine Wohnung zwischen zwei Mietern herzurichten. Ich zeige, wie Sie das kurze Zeitfenster optimal nutzen.',
    datum: '2026-07-28',
    kategorie: 'Sanierung',
    lesezeit: '6 Min.',
    bild: 'nachher.jpg',
    bildAlt: 'Symbolbild: leere, frisch hergerichtete Wohnung vor der Neuvermietung',
    kurz: [
      'Die Leerstandszeit beim Mieterwechsel ist das ideale Fenster für Renovierung.',
      'Frische Wände, ein neuer Boden und ein aufgefrischtes Bad wirken am stärksten.',
      'Ein Ansprechpartner und ein enger Zeitplan halten den Leerstand kurz.',
      'Jede Woche weniger Leerstand ist Miete, die Sie nicht verlieren.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Warum der Mieterwechsel die beste Gelegenheit ist',
        paras: [
          'Eine bewohnte Wohnung zu sanieren ist Stückwerk – ein Zimmer nach dem anderen, Möbel rücken, Rücksicht nehmen. Steht die Wohnung dagegen leer, kann man durcharbeiten. Das ist schneller, sauberer und am Ende günstiger.',
          'Genau dieses Fenster entsteht beim Mieterwechsel. Im Sommer, der klassischen Umzugszeit, besonders oft – und wer es nutzt, spart sich später den Ärger im bewohnten Zustand.',
        ],
      },
      {
        h2: 'Das Zeitfenster clever nutzen',
        paras: [
          'Der Fehler, den ich am häufigsten sehe: Man wartet, bis der alte Mieter raus ist, und fängt dann erst an zu planen. Da sind schon Wochen verloren.',
          'Besser: Sobald die Kündigung da ist, das Objekt anschauen, das Angebot machen, Material und Termine vorbereiten. Dann kann es losgehen, sobald der Schlüssel zurückkommt – und nicht drei Wochen später.',
        ],
        bild: 'blog-detail.jpg',
        bildAlt: 'Symbolbild: Detail einer frisch renovierten Wohnung',
      },
      {
        h2: 'Was sich für die Neuvermietung lohnt',
        paras: [
          'Nicht alles muss neu. Den größten Effekt auf den ersten Eindruck – und damit auf die Miete – haben erfahrungsgemäß diese Arbeiten:',
        ],
        list: [
          'Wände streichen: frische, helle Wände wirken sofort.',
          'Boden erneuern oder aufarbeiten, wo er abgenutzt ist.',
          'Bad und Fugen auffrischen, wo es günstig geht.',
          'Kleinreparaturen: klemmende Türen, lose Leisten, defekte Silikonfugen.',
        ],
      },
      {
        h2: 'Leerstand kurz halten – so geht es',
        paras: [
          'Jede Woche Leerstand kostet Miete. Deshalb zählt beim Mieterwechsel Tempo, ohne dass die Qualität leidet. Ein Ansprechpartner, der alle Gewerke koordiniert, und ein enger, realistischer Zeitplan sind hier Gold wert.',
          'Wir bereiten alles so vor, dass ab Schlüsselübergabe durchgearbeitet werden kann – und Sie die Wohnung so früh wie möglich wieder inserieren können.',
        ],
      },
      {
        h2: 'Kurz zum Rechtlichen',
        paras: [
          'Was Sie von der alten Kaution einbehalten dürfen, welche Schönheitsreparaturen der Mieter schuldet und was Sache des Vermieters ist – das hängt am Mietvertrag und an der aktuellen Rechtslage. Klären Sie das im Zweifel mit Ihrer Hausverwaltung oder einem Fachanwalt für Mietrecht.',
          'Wir kümmern uns um die Handwerksleistung, nicht um die Rechtsberatung – das gehört klar getrennt.',
        ],
      },
      {
        h2: 'Mieterwechsel-Sanierung im Raum Heilbronn',
        paras: [
          'Wir richten Wohnungen im Raum Heilbronn zwischen zwei Mietern her – vom frischen Anstrich bis zur kompletten Auffrischung, aus einer Hand und mit einem Ansprechpartner.',
          'Melden Sie sich am besten, sobald die Kündigung da ist. Je früher wir schauen, desto kürzer bleibt der Leerstand.',
        ],
      },
    ],
  },
  {
    slug: 'malerkosten-pro-qm',
    metaTitle: 'Malerkosten pro m²: Was Wände streichen lassen kostet 2026 | SE Handwerk',
    metaDescription:
      'Malerkosten pro m²: Was kostet es, Wände streichen zu lassen? Richtwerte für Streichen, Spachteln und Tapezieren, was den Preis treibt und wo Sie sparen können.',
    title: 'Malerkosten pro m²: Was Wände streichen lassen kostet',
    excerpt:
      'Streichen kann doch jeder, oder? Kann man selbst machen – oder machen lassen und die Wochenenden behalten. Ich zeige, was der Maler pro Quadratmeter kostet und woran der Preis hängt.',
    datum: '2026-07-29',
    kategorie: 'Wand & Decke',
    lesezeit: '6 Min.',
    bild: 'blog-maler.jpg',
    bildAlt: 'Symbolbild: frisch gestrichene weiße Wand mit sauberer Kante',
    kurz: [
      'Wände streichen lassen kostet grob 8 bis 20 Euro pro m² Wandfläche.',
      'Spachteln, Grundieren und Vorarbeiten kommen je nach Zustand obendrauf.',
      'Gerechnet wird nach Wand- und Deckenfläche, nicht nach Bodenfläche.',
      'Tapeten entfernen, Risse und dunkle Altfarben treiben den Preis nach oben.',
    ],
    relatedLeistung: 'wand-decke',
    sections: [
      {
        h2: 'Was kostet es, Wände streichen zu lassen?',
        paras: [
          'Als Richtwert liegen die Malerkosten fürs reine Streichen bei etwa 8 bis 20 Euro pro Quadratmeter Wandfläche. Klingt überschaubar – bis man merkt, wie viel Wand eine Wohnung wirklich hat.',
          'Eine 70-Quadratmeter-Wohnung bringt schnell 200 Quadratmeter Wand- und Deckenfläche auf die Waage. Das erklärt, warum Streichen in der Summe mehr kostet, als viele erwarten. Und wie immer: Richtwerte, kein Angebot.',
        ],
      },
      {
        h2: 'Wie wird die Fläche überhaupt berechnet?',
        paras: [
          'Maler rechnen nach zu streichender Fläche – Wände plus Decken, große Fenster und Türen abgezogen. Als grobe Faustregel nimmt man oft das Zweieinhalb- bis Dreifache der Wohnfläche.',
          'Die Quadratmeterzahl aus dem Mietvertrag ist also nur der Anfang. Für einen belastbaren Preis schaut man sich die Räume an – Höhe, Zustand und Schnitt machen den Unterschied.',
        ],
        bild: 'blog-maler.jpg',
        bildAlt: 'Symbolbild: hell gestrichener Raum',
      },
      {
        h2: 'Was den Malerpreis treibt',
        paras: [
          'Streichen ist nicht gleich streichen. Diese Punkte entscheiden, ob Sie am unteren oder oberen Ende landen:',
        ],
        list: [
          'Zustand der Wände – glatt und intakt oder rissig und uneben.',
          'Spachteln und Grundieren als Vorarbeit.',
          'Tapeten entfernen oder neu tapezieren.',
          'Farbwechsel von dunkel auf hell, der mehrere Anstriche braucht.',
          'Raumhöhe und Aufwand fürs Abkleben und Abdecken.',
        ],
      },
      {
        h2: 'Selbst streichen oder machen lassen?',
        paras: [
          'Eine leere Wohnung in Weiß kann man mit Zeit und Sorgfalt selbst streichen. Sobald es um Spachteln, Risse, hohe Decken oder ein sauberes Ergebnis unter Zeitdruck geht, lohnt der Fachbetrieb – schon wegen der Vorarbeit, die über das Endbild entscheidet.',
          'Ehrlich gesagt: Den Unterschied zwischen selbst gestrichen und fachgerecht gemacht sieht man erst im Streiflicht. Für die Vermietung zählt genau das.',
        ],
      },
      {
        h2: 'Malerarbeiten im Raum Heilbronn',
        paras: [
          'Wir übernehmen Malerarbeiten im Raum Heilbronn – einzeln oder als Teil einer Sanierung, inklusive Spachteln und Vorarbeit. Fester Preis, sauberes Ergebnis, besenreine Übergabe.',
          'Vor allem vor einer Vermietung machen frische, gleichmäßige Wände oft den größten Unterschied fürs kleinste Geld.',
        ],
      },
    ],
  },
  {
    slug: 'estrich-trocknungszeit',
    metaTitle: 'Estrich Trocknungszeit: Wie lange muss Estrich trocknen? | SE Handwerk',
    metaDescription:
      'Estrich Trocknungszeit: Wie lange muss Estrich trocknen, bevor der Boden verlegt wird? Faustregeln, Einflussfaktoren und warum nur die gemessene Restfeuchte zählt.',
    title: 'Estrich Trocknungszeit: Wie lange muss Estrich wirklich trocknen?',
    excerpt:
      'Die eine Frage, die ganze Zeitpläne sprengt: Wann ist der Estrich endlich trocken? Ich erkläre die Faustregeln – und warum am Ende nur das Messgerät entscheidet.',
    datum: '2026-07-29',
    kategorie: 'Bodenarbeiten',
    lesezeit: '6 Min.',
    bild: 'blog-estrich.jpg',
    bildAlt: 'Symbolbild: frischer Zementestrich in einem leeren Raum beim Trocknen',
    kurz: [
      'Faustregel Zementestrich: rund 1 Woche pro Zentimeter – aber nur für die ersten 4 cm.',
      'Ab etwa 6 cm Dicke dauert es überproportional länger.',
      'Entscheidend ist nicht die Zeit, sondern die gemessene Restfeuchte (CM-Messung).',
      'Ein zu früh verlegter Boden kann sich später wölben oder ablösen.',
    ],
    relatedLeistung: 'bodenarbeiten',
    sections: [
      {
        h2: 'Wie lange muss Estrich trocknen?',
        paras: [
          'Die klassische Faustregel für Zementestrich lautet: etwa eine Woche pro Zentimeter Dicke – aber nur für die ersten vier Zentimeter. Danach wird es überproportional länger. Ein sechs Zentimeter dicker Estrich braucht also spürbar mehr als sechs Wochen.',
          'In der Praxis landet man bei üblichen Dicken schnell bei mehreren Wochen bis über zwei Monaten. Das ist eine grobe Orientierung, keine feste Zusage – die tatsächliche Zeit hängt von einigen Faktoren ab.',
        ],
      },
      {
        h2: 'Was die Trocknung beeinflusst',
        paras: [
          'Warum zwei gleich dicke Estriche unterschiedlich lange brauchen? Daran liegt es:',
        ],
        list: [
          'Estrichart – Zementestrich trocknet langsamer als Calciumsulfat-/Anhydritestrich.',
          'Dicke des Estrichs.',
          'Temperatur und Luftfeuchtigkeit im Raum.',
          'Lüften und, falls vorhanden, das fachgerechte Funktionsheizen der Fußbodenheizung.',
          'Jahreszeit – im warmen, trockenen Sommer schneller, im nasskalten Winter langsamer.',
        ],
        bild: 'blog-estrich.jpg',
        bildAlt: 'Symbolbild: trocknender Estrich in einem Rohbau',
      },
      {
        h2: 'Warum die Zeit allein nicht reicht',
        paras: [
          'Auf die Faustregel allein sollte sich niemand verlassen. Was zählt, ist die Restfeuchte – gemessen, klassisch mit der CM-Messung. Erst wenn der Wert unter dem Grenzwert für den geplanten Belag liegt, darf verlegt werden.',
          'Wer zu früh verlegt, riskiert, dass sich der Boden später wölbt, ablöst oder Feuchteschäden entstehen. Das ist der teuerste Weg, ein paar Tage zu sparen.',
        ],
      },
      {
        h2: 'Lässt sich die Trocknung beschleunigen?',
        paras: [
          'Ein bisschen. Gleichmäßiges Lüften hilft, ebenso das fachgerechte Funktionsheizen bei einer Fußbodenheizung. Bautrockner können unterstützen. Überstürzen lässt sich der Prozess aber nicht – Estrich braucht seine Zeit, egal wie eng der Terminplan ist.',
          'Im Sommer arbeitet die warme, trockene Luft ohnehin für Sie. Mehr dazu in unserem Beitrag zum Sanieren im Sommer.',
        ],
      },
      {
        h2: 'Bodenarbeiten im Raum Heilbronn',
        paras: [
          'Wir planen den Bodenaufbau im Raum Heilbronn so, dass Trocknungszeiten von Anfang an im Taktplan stehen – und verlegen erst, wenn die Restfeuchte passt. Kein Risiko fürs schnelle Fertigwerden.',
          'Klingt selbstverständlich, ist aber genau die Stelle, an der Baustellen ohne saubere Koordination auflaufen.',
        ],
      },
    ],
  },
  {
    slug: 'barrierefreies-bad-kosten',
    metaTitle: 'Barrierefreies Bad: Kosten, Umbau & Zuschüsse | SE Handwerk',
    metaDescription:
      'Barrierefreies Bad: Was kostet der Umbau zur bodengleichen Dusche und zum altersgerechten Bad? Richtwerte, Maßnahmen und mögliche Zuschüsse im Überblick.',
    title: 'Barrierefreies Bad: Kosten, Umbau und mögliche Zuschüsse',
    excerpt:
      'Ein Bad, das auch mit 80 noch funktioniert – oder nach einer OP, oder mit Rollator. Ich zeige, was der barrierefreie Umbau kostet, welche Maßnahmen zählen und wo es Zuschüsse geben kann.',
    datum: '2026-07-29',
    kategorie: 'Bad & Sanitär',
    lesezeit: '7 Min.',
    bild: 'blog-bad.jpg',
    bildAlt: 'Symbolbild: modernes Bad mit bodengleicher Dusche',
    kurz: [
      'Ein barrierearmer Badumbau beginnt grob ab einigen Tausend Euro, ein komplett barrierefreies Bad liegt deutlich höher.',
      'Kernstück ist fast immer die bodengleiche, schwellenlose Dusche.',
      'Für altersgerechte Umbauten gibt es je nach Fall Zuschüsse (z. B. Pflegekasse, KfW).',
      'Förderbedingungen ändern sich – vor dem Umbau die aktuellen Konditionen prüfen.',
    ],
    relatedLeistung: 'bad-sanitaer',
    sections: [
      {
        h2: 'Was kostet ein barrierefreies Bad?',
        paras: [
          'Das hängt davon ab, wie weit man geht. Eine einzelne Maßnahme wie der Umbau zur bodengleichen Dusche beginnt grob bei einigen Tausend Euro. Ein komplett barrierefreies Bad nach Norm – mit ausreichend Bewegungsfläche und unterfahrbarem Waschtisch – liegt deutlich darüber.',
          'Wie immer sind das Richtwerte, kein Angebot. Bei der Aufnahme vor Ort sehen wir, was baulich möglich ist und was es kostet.',
        ],
      },
      {
        h2: 'Die wichtigsten Maßnahmen',
        paras: [
          'Nicht jedes Bad muss die volle Norm erfüllen. Diese Maßnahmen bringen im Alltag am meisten:',
        ],
        list: [
          'Bodengleiche, schwellenlose Dusche.',
          'Rutschhemmende Fliesen.',
          'Haltegriffe und die dafür nötigen verstärkten Wände.',
          'Unterfahrbarer Waschtisch, erhöhtes WC.',
          'Breitere Türen und mehr Bewegungsfläche.',
        ],
        bild: 'leistung-bad.jpg',
        bildAlt: 'Symbolbild: Detail eines modernen, barrierearmen Bades',
      },
      {
        h2: 'Barrierefrei oder barrierearm – wo ist der Unterschied?',
        paras: [
          'Barrierefrei ist ein Begriff mit Norm dahinter (DIN 18040), mit festen Maßen für Bewegungsflächen. Vieles, was im Alltag hilft, ist streng genommen barrierearm: bodengleiche Dusche, Haltegriffe, rutschhemmende Fliesen. Für die meisten reicht genau das.',
          'Was in Ihrem Fall sinnvoll und baulich machbar ist, klärt man am besten vor Ort – bei anerkanntem Pflegegrad gegebenenfalls zusammen mit der Pflegekasse.',
        ],
      },
      {
        h2: 'Zuschüsse und Förderung',
        paras: [
          'Für altersgerechte oder pflegebedingte Umbauten gibt es je nach Situation Zuschüsse – etwa von der Pflegekasse bei anerkanntem Pflegegrad oder über Förderprogramme wie die der KfW. Höhe und Bedingungen ändern sich aber immer wieder.',
          'Deshalb ganz klar: Prüfen Sie die aktuellen Konditionen vor dem Umbau bei der jeweiligen Stelle oder lassen Sie sich dort beraten. Wir liefern die handwerkliche Leistung – die Förder- und Antragsberatung gehört in andere, kompetente Hände.',
        ],
      },
      {
        h2: 'Barrierefreies Bad im Raum Heilbronn',
        paras: [
          'Wir bauen Bäder im Raum Heilbronn barrierearm und barrierefrei um – von der bodengleichen Dusche bis zum kompletten altersgerechten Bad, aus einer Hand und mit einem Ansprechpartner.',
          'Sagen Sie uns, worum es geht. Wir schauen vor Ort, was möglich ist, und sind ehrlich, wenn eine Idee baulich nicht aufgeht.',
        ],
      },
    ],
  },
  {
    slug: 'kernsanierung-kosten',
    metaTitle: 'Kernsanierung Kosten: Was die Vollsanierung pro m² kostet | SE Handwerk',
    metaDescription:
      'Kernsanierung Kosten: Was kostet eine Vollsanierung pro m²? Richtwerte, was alles dazugehört, die größten Kostentreiber und wie Sie das Budget im Griff behalten.',
    title: 'Kernsanierung Kosten: Was eine Vollsanierung wirklich kostet',
    excerpt:
      'Kernsanierung klingt nach einem Wort und einer Zahl – ist aber ein Dutzend Gewerke und ein weites Preisfeld. Ich ordne ein, womit Sie pro Quadratmeter rechnen sollten.',
    datum: '2026-07-29',
    kategorie: 'Sanierung',
    lesezeit: '7 Min.',
    bild: 'nachher.jpg',
    bildAlt: 'Symbolbild: fertig kernsanierte, bezugsfertige Wohnung',
    kurz: [
      'Eine Kernsanierung kostet grob ab 600 bis über 1.500 Euro pro m² – je nach Zustand und Umfang.',
      'Bei einer Kernsanierung wird bis auf den Rohbau zurückgebaut.',
      'Größte Kostentreiber: Bäder, Elektrik, Leitungen und Grundriss-Änderungen.',
      'Ohne Aufnahme vor Ort ist jede Zahl reine Schätzung.',
    ],
    relatedLeistung: 'komplettsanierung',
    sections: [
      {
        h2: 'Was kostet eine Kernsanierung pro m²?',
        paras: [
          'Grobe Orientierung: Eine Kernsanierung liegt oft irgendwo zwischen 600 und über 1.500 Euro pro Quadratmeter Wohnfläche. Die Spanne ist riesig, weil Kernsanierung fast alles heißen kann – von innen komplett neu bis zurück auf die tragenden Wände.',
          'Bei einem Altbau, bei dem Leitungen, Elektrik und Bäder mit müssen, landet man schnell im oberen Bereich. Belastbar wird die Zahl erst nach einer Aufnahme. Vorher ist es Schätzen – ehrlich gesagt.',
        ],
      },
      {
        h2: 'Was gehört alles zu einer Kernsanierung?',
        paras: [
          'Kernsanierung heißt: Es geht ans Eingemachte. Typischerweise steckt das drin:',
        ],
        list: [
          'Rückbau bis auf den Rohbau, inklusive Entsorgung.',
          'Neue Elektrik und Leitungen für Wasser und Abwasser, teils Heizung.',
          'Trockenbau, Putz und Estrich.',
          'Neue Bäder und Böden.',
          'Fenster und Türen, je nach Zustand.',
          'Maler- und Endarbeiten bis zur Übergabe.',
        ],
        bild: 'leistung-komplett.jpg',
        bildAlt: 'Symbolbild: Wohnung in der Kernsanierung',
      },
      {
        h2: 'Die größten Kostentreiber',
        paras: [
          'Am meisten Geld verschlingen erfahrungsgemäß die Bäder, die Elektrik und alles mit Leitungen und Rohren – weil es Handarbeit ist und hinter alten Wänden gern Überraschungen wartet. Auch geänderte Grundrisse und der Umfang des Rückbaus schlagen durch.',
          'Fenster und Fassade sind eigene große Posten, gehören aber nicht bei jeder Kernsanierung dazu. Was sinnvoll ist, hängt vom Objekt und Ihrem Ziel ab.',
        ],
      },
      {
        h2: 'Budget im Griff behalten',
        paras: [
          'Zwei Dinge helfen wirklich: ein verbindlicher Festpreis vor Baubeginn und ein Puffer für das, was hinter alten Wänden auftaucht. Gerade im Altbau kommt fast immer etwas, das vorher niemand sehen konnte.',
          'Ein aufgeschlüsseltes Angebot zeigt, wo das Geld hingeht – und wo sich Prioritäten setzen lassen, ohne an der Substanz zu sparen.',
        ],
      },
      {
        h2: 'Kernsanierung im Raum Heilbronn – aus einer Hand',
        paras: [
          'Wir übernehmen Kernsanierungen im Raum Heilbronn komplett: alle Gewerke koordiniert, ein Ansprechpartner, ein Festpreis. Bei einem so großen Projekt ist das der Unterschied zwischen Bauleiter-Stress und einem fertigen Ergebnis.',
          'Erzählen Sie uns von Ihrem Objekt – wir schauen es uns an und sagen ehrlich, was drinsteckt.',
        ],
      },
    ],
  },
  {
    slug: 'wohnungsuebergabe-checkliste',
    metaTitle: 'Wohnungsübergabe: Checkliste für Eigentümer 2026 | SE Handwerk',
    metaDescription:
      'Wohnungsübergabe-Checkliste für Vermieter und Eigentümer: Übergabeprotokoll, Zählerstände, Mängel dokumentieren, Schlüssel, Kaution. Was rein muss – und wie Sie die Wohnung vor der Übergabe herrichten.',
    title: 'Wohnungsübergabe: die Checkliste für Eigentümer',
    excerpt:
      'Zwei Parteien, ein enger Termin, oft schlechte Laune – und am Ende streiten alle um die Kaution. Dabei entscheidet sich das meiste an einem Blatt Papier: dem Übergabeprotokoll. Hier steht, was wirklich reingehört, und wo die teuren Fehler passieren.',
    datum: '2026-08-06',
    kategorie: 'Ratgeber',
    lesezeit: '10 Min.',
    bild: 'blog-uebergabe.jpg',
    bildAlt: 'Symbolbild: leere frisch renovierte Wohnung bei der Übergabe, Schlüssel auf der Fensterbank',
    kurz: [
      'Das Übergabeprotokoll ist das wichtigste Dokument – ohne Unterschrift beider Seiten wird es im Streitfall wertlos.',
      'Zählerstände (Strom, Gas, Wasser) mit Zählernummer notieren und am besten fotografieren.',
      'Mängel einzeln und konkret festhalten – „Wohnung in Ordnung" hilft später niemandem.',
      'Kleine Reparaturen und Malerarbeiten vor der Übergabe rechnen sich fast immer: Eine gepflegte Wohnung geht schneller wieder weg.',
    ],
    relatedLeistung: 'einzelgewerke',
    sections: [
      {
        h2: 'Warum sich alles an einem Blatt Papier entscheidet',
        paras: [
          'Ich habe schon einige Wohnungsübergaben von der Seite miterlebt. Das Muster ist fast immer gleich: Es ist der letzte Tag im Monat, der Möbelwagen steht noch halb voll unten, jemand hat den Schlüssel verlegt, und niemand hat Zeit. Genau in dieser Hektik wird das Dokument ausgefüllt, um das später gestritten wird – das Übergabeprotokoll.',
          'Ob Sie als Vermieter eine Wohnung zurücknehmen oder als Eigentümer ein gekauftes Objekt übernehmen: Dieser eine Termin legt fest, wer für welchen Schaden geradesteht und ob die Kaution fließt oder einbehalten wird. Wer hier schludert, zahlt oft später drauf.',
          'Deshalb dieser Beitrag: eine ehrliche Checkliste, was in eine saubere Wohnungsübergabe gehört – aus Sicht von jemandem, der die Wohnungen danach wieder herrichtet. Rechtsberatung ist das ausdrücklich nicht; bei echten Streitfällen führt am Mieterverein oder einem Fachanwalt kein Weg vorbei.',
        ],
      },
      {
        h2: 'Wohnungsübergabe-Checkliste: Was ins Protokoll gehört',
        paras: [
          'Ein gutes Übergabeprotokoll ist kein Roman und kein Formular von der Stange, das man blind abhakt. Es hält nüchtern fest, in welchem Zustand die Wohnung an diesem Tag ist. Diese Punkte sollten drinstehen:',
        ],
        list: [
          'Datum, vollständige Adresse und die Namen beider Parteien',
          'Zählerstände für Strom, Gas und Wasser – jeweils mit Zählernummer',
          'Zustand jedes Raumes einzeln: Wände, Böden, Fenster, Türen',
          'Zustand von Küche, Bad und fest verbauten Geräten',
          'Anzahl und Art der übergebenen Schlüssel (Haustür, Wohnung, Keller, Briefkasten)',
          'Vorhandene Mängel – jeder einzeln und konkret beschrieben',
          'Unterschrift beider Parteien, im besten Fall mit einem Zeugen',
        ],
      },
      {
        h2: 'Zählerstände: der Klassiker, den alle vergessen',
        paras: [
          'Kein Punkt sorgt später für so viel unnötigen Ärger wie ein fehlender Zählerstand. Wird er beim Auszug nicht festgehalten, streiten sich hinterher zwei Parteien um eine Nachzahlung, die niemand mehr zuordnen kann.',
          'Notieren Sie zu jedem Zähler die Zählernummer und den Stand am Übergabetag. Ein Foto vom Display beziehungsweise vom Zählwerk kostet zwei Sekunden und beendet jede spätere Diskussion. Bei modernen digitalen Zählern lohnt sich der Blick auf das Datum im Display – manchmal steht die relevante Zahl erst nach ein paarmal Durchklicken da.',
        ],
      },
      {
        h2: 'Mängel dokumentieren – Fotos schlagen Erinnerung',
        paras: [
          'Der zweite große Fehler: pauschale Formulierungen. „Wohnung in gutem Zustand" klingt beim Unterschreiben harmlos und ist im Streitfall wertlos. Konkret muss es sein: „Parkett Wohnzimmer, Kratzer ca. 20 cm unter dem Fenster" statt „Boden okay".',
          'Machen Sie zu jedem Mangel ein Foto und halten Sie im Protokoll fest, dass Fotos existieren. Ein paar Wochen später weiß niemand mehr, ob der Fleck an der Wand schon vorher da war. Das Bild weiß es.',
          'Und trennen Sie sauber zwischen normalen Gebrauchsspuren und echten Schäden. Ein Mieter darf eine Wohnung bewohnen – abgelaufene Teppiche oder Dübellöcher in üblichem Rahmen gehören meist zum normalen Verschleiß. Wo genau die Grenze liegt, ist ein juristisches Dauerthema; im Zweifel klärt das eine Rechtsberatung, nicht das Protokoll.',
        ],
        bild: 'blog-detail.jpg',
        bildAlt: 'Symbolbild: genauer Blick auf Boden und Sockelleiste bei der Wohnungsübergabe',
      },
      {
        h2: 'Schlüssel: zählen, notieren, quittieren',
        paras: [
          'Klingt banal, wird aber regelmäßig zum Problem. Halten Sie fest, wie viele Schlüssel für was übergeben werden – Haustür, Wohnungstür, Keller, Briefkasten, Garage. Fehlt später ein Schlüssel, ist im Protokoll dokumentiert, wie viele es einmal waren.',
          'Bei einer Schließanlage kann ein einzelner verlorener Schlüssel richtig teuer werden, weil unter Umständen die ganze Anlage getauscht werden muss. Deshalb lieber einmal zu genau zählen als hinterher rätseln.',
        ],
      },
      {
        h2: 'Kaution und Schönheitsreparaturen – die Grauzone',
        paras: [
          'Jetzt wird es heikel, und hier bleibe ich bewusst vorsichtig: Rund um Kaution und Schönheitsreparaturen gibt es mehr Halbwissen als bei fast jedem anderen Thema. Vieles, was für selbstverständlich gehalten wird, ist vor Gericht schon gekippt worden – etwa starre Renovierungsfristen oder pauschale Klauseln im Mietvertrag.',
          'Als grobe Orientierung gilt: Die Kaution darf für berechtigte Ansprüche einbehalten werden, muss aber nach dem Auszug in angemessener Zeit abgerechnet werden. Was „berechtigt" und „angemessen" konkret heißt, hängt vom Einzelfall und vom Mietvertrag ab.',
          'Deshalb der klare Rat: Wenn es um Geld und Schönheitsreparaturen geht, verlassen Sie sich nicht auf Faustregeln aus dem Internet – auch nicht auf meine. Ein kurzer Check beim Mieterverein, beim Eigentümerverband oder bei einem Fachanwalt für Mietrecht ist das Geld fast immer wert.',
        ],
      },
      {
        h2: 'Die Wohnung vor der Übergabe herrichten – was sich lohnt',
        paras: [
          'Jetzt der Teil, bei dem wir ins Spiel kommen. Bei einem Mieterwechsel entscheidet sich zwischen Auszug und Neuvermietung, wie schnell die Wohnung wieder Geld bringt. Jede Woche Leerstand ist Miete, die niemand zahlt.',
          'Was sich aus meiner Erfahrung fast immer rechnet, bevor der nächste Mieter kommt: Wände frisch streichen, kleine Schäden an Türen und Zargen ausbessern, verschlissene Silikonfugen im Bad erneuern und – wenn der Boden durch ist – gleich neuen Vinyl- oder Laminatboden verlegen. Das sind keine großen Summen, aber sie machen aus „bewohnt" wieder „bezugsfertig".',
          'Der Trick ist das Timing: Wenn Malerarbeiten, kleine Reparaturen und Boden im selben Zug laufen, statt einzeln über Wochen, steht die Wohnung nur einmal kurz leer. Genau dafür ist ein Ansprechpartner für alle Gewerke Gold wert.',
        ],
        bild: 'blog-sanierung.jpg',
        bildAlt: 'Symbolbild: frisch hergerichtete leere Wohnung, bezugsfertig zur Neuvermietung',
      },
      {
        h2: 'Übergabe bei Mieterwechsel: der enge Zeitplan',
        paras: [
          'Der Klassiker bei der Neuvermietung: Der alte Mieter zieht Ende des Monats aus, der neue will zum Ersten rein. Dazwischen liegt oft nur ein Wochenende – und in dieser Lücke sollen Übergabe, Herrichten und erneute Übergabe passieren.',
          'Ehrlich gesagt ist das selten realistisch, wenn mehr zu tun ist als einmal durchwischen. Wer hier Puffer einplant und die Handwerker früh koordiniert, spart sich den Stress. Und wenn sich doch etwas verschiebt, weil hinter dem alten Boden eine Überraschung steckt, erfahren Sie das bei uns zuerst – nicht am Übergabetag.',
        ],
      },
      {
        h2: 'Wohnungsübergabe im Raum Heilbronn – wir richten her',
        paras: [
          'Wir richten Wohnungen im Raum Heilbronn zwischen zwei Mietern her: Malerarbeiten, kleine Reparaturen, Böden, Bad – koordiniert, mit einem Ansprechpartner und einem Festpreis vor Baubeginn. Sie sagen uns, bis wann die Wohnung bezugsfertig sein soll, wir sagen ehrlich, ob das zu schaffen ist.',
          'Gerade für Vermieter und Kapitalanleger, die nicht vor Ort sind, übernehmen wir den ganzen Ablauf – vom leergeräumten Zustand bis zur schlüsselfertigen Übergabe an den nächsten Mieter. Schauen Sie sich in Ruhe um, dann sprechen wir über Ihr Objekt.',
        ],
      },
    ],
  },
  {
    slug: 'fliesen-verlegen-kosten',
    metaTitle: 'Fliesen verlegen: Kosten pro m² 2026 | SE Handwerk',
    metaDescription:
      'Was kostet Fliesen verlegen pro m²? Preise für Material und Arbeit, Aufpreis für Großformat und Verlegemuster, Untergrund, Abdichtung im Bad und ein Rechenbeispiel – Raum Heilbronn.',
    title: 'Fliesen verlegen: Kosten pro m² im Überblick',
    excerpt:
      'Kaum ein Gewerk hat so eine Preisspanne wie Fliesen. Das gleiche Bad kann 2.000 Euro kosten oder das Doppelte – je nach Format, Muster und Untergrund. Hier sind ehrliche Zahlen, ein Rechenbeispiel und die Posten, an die kaum jemand denkt.',
    datum: '2026-08-11',
    kategorie: 'Bad & Fliesen',
    lesezeit: '10 Min.',
    bild: 'blog-fliesen.jpg',
    bildAlt: 'Symbolbild: frisch verlegter großformatiger Fliesenboden in einem hellen Raum',
    kurz: [
      'Fliesen verlegen kostet als grober Richtwert etwa 40–100 € pro m² (Material + Arbeit).',
      'Die reine Verlegung liegt bei rund 30–60 €/m², das Material fängt bei ca. 15 €/m² an – nach oben offen.',
      'Großformat, Diagonalverlegung und aufwändige Muster kosten Aufpreis – die Arbeit, nicht die Fliese.',
      'Im Bad ist die Abdichtung Pflicht und der Posten, an dem man niemals sparen sollte.',
    ],
    relatedLeistung: 'bad-sanitaer',
    sections: [
      {
        h2: 'Was kostet Fliesen verlegen pro m²?',
        paras: [
          'Kurz gesagt: Material und Arbeit zusammen liegen meist zwischen 40 und 100 Euro pro Quadratmeter. Das ist eine große Spanne – und sie ist ehrlich. Kaum ein Gewerk streut so stark, weil drei Dinge den Preis machen: die Fliese selbst, das Format und Verlegemuster, und der Zustand des Untergrunds.',
          'Ein schlichter Boden mit mittelgroßen Fliesen im Verband liegt am unteren Ende. Ein Bad mit großformatigen Platten, diagonal verlegt, auf einem Untergrund, der erst gerichtet und abgedichtet werden muss, landet schnell am oberen Ende – oder darüber.',
          'Damit wir uns richtig verstehen: Das sind grobe Marktrichtwerte zur Orientierung, kein Angebot. Preise ändern sich, jeder Raum ist anders. Was Ihr Boden oder Bad kostet, weiß ich erst, wenn ich den Raum gesehen habe – dann aber als Festpreis, ohne böse Nachträge.',
        ],
      },
      {
        h2: 'Materialkosten: Was kostet die Fliese selbst?',
        paras: [
          'Bei der Fliese ist nach oben alles offen. Einfache Feinsteinzeug-Fliesen fangen je nach Angebot bei rund 15 bis 25 Euro pro Quadratmeter an. Gute Markenfliesen liegen eher bei 30 bis 60 Euro, und bei großformatigen Platten, Naturstein oder Designserien ist die Grenze nach oben offen.',
          'Feinsteinzeug ist für die meisten Wohnungen die vernünftige Wahl: hart, dicht, pflegeleicht und für Boden wie Wand geeignet. Naturstein sieht edel aus, will aber mehr Pflege und ist in der Verlegung heikler – das schlägt sich im Arbeitspreis nieder.',
          'Nicht vergessen: Verschnitt. Je nach Raum und Muster rechnet man erfahrungsgemäß rund 10 Prozent mehr Fliesen ein, bei Diagonalverlegung eher mehr. Diese Fliesen liegen am Ende zwar im Container, stehen aber trotzdem auf der Rechnung.',
        ],
      },
      {
        h2: 'Verlegekosten: Was kostet die Arbeit?',
        paras: [
          'Für die reine Verlegung durch einen Fachbetrieb rechnen Sie grob 30 bis 60 Euro pro Quadratmeter. Das ist bei Fliesen oft der größere Batzen – anders als bei einem Klickboden ist Fliesenlegen echtes Handwerk, Reihe für Reihe, mit Zuschnitt an jeder Kante.',
          'Der Preis hängt stark am Aufwand: viele Ecken, Nischen, Rohre und Zuschnitte kosten Zeit. Ein rechteckiger, leerer Raum ist günstiger pro Quadratmeter als ein verwinkeltes Bad mit Dusche, WC und Waschtisch, wo jeder zweite Quadratmeter ein Sonderfall ist.',
        ],
      },
      {
        h2: 'Format und Verlegemuster – hier entsteht der Aufpreis',
        paras: [
          'Ein Punkt, den viele unterschätzen: Nicht die teure Fliese treibt den Arbeitspreis, sondern das Format und das Muster. Großformatige Platten müssen absolut eben liegen, sonst kippeln sie – das verlangt einen top vorbereiteten Untergrund und mehr Zeit. Diagonal oder im aufwändigen Muster verlegt bedeutet mehr Zuschnitt, mehr Verschnitt, mehr Stunden.',
        ],
        list: [
          'Standard-Verband, mittleres Format: günstigste Variante',
          'Großformat (60×60 cm und größer): Aufpreis für Untergrund und Handling',
          'Diagonalverlegung: mehr Zuschnitt und Verschnitt',
          'Muster wie Fischgrät oder Verband mit Versatz: deutlicher Zeitaufschlag',
          'Mosaik und Bordüren: kleinteilig, entsprechend teuer pro m²',
        ],
        bild: 'blog-bad.jpg',
        bildAlt: 'Symbolbild: frisch gefliestes modernes Bad mit großformatigen Fliesen',
      },
      {
        h2: 'Untergrund und Abdichtung – der Posten fürs Bad',
        paras: [
          'Wenn Fliesen später Ärger machen, liegt es fast nie an der Fliese, sondern am Untergrund. Er muss eben, tragfähig und trocken sein. Ist er das nicht, kommen Ausgleichsmasse, Grundierung oder das Entfernen alter Beläge dazu – das kostet extra, ist aber die Grundlage dafür, dass die Fläche bei fachgerechter Ausführung dauerhaft hält.',
          'Im Bad kommt die Abdichtung dazu, und die ist keine Kür, sondern Pflicht. In Duschen und an Wänden, die nass werden, gehört eine fachgerechte Verbundabdichtung unter die Fliese. Das ist der Posten, an dem man auf keinen Fall sparen sollte – ein Wasserschaden hinter der Fliese kostet später ein Vielfaches.',
        ],
      },
      {
        h2: 'Diese Zusatzkosten kommen oft dazu',
        paras: [
          'Jetzt die Posten, die auf keinem Online-Rechner stehen – und am Ende trotzdem auf der Rechnung landen:',
        ],
        list: [
          'Rückbau und Entsorgung der alten Fliesen',
          'Untergrund ausgleichen, grundieren, abdichten',
          'Verfugen und dauerelastische Silikonfugen',
          'Übergangs-, Eck- und Abschlussprofile',
          'Aussparungen und Bohrungen für Sanitärobjekte',
        ],
      },
      {
        h2: 'Rechenbeispiel: Bad und Wohnzimmerboden',
        paras: [
          'Rechnen wir grob durch – rein zur Orientierung, ausdrücklich kein Angebot. Ein kleines Bad mit rund 8 Quadratmetern Boden plus Wandflächen ist wegen Abdichtung, Zuschnitten und Verwinklung arbeitsintensiv: Nur für die Fliesenarbeiten inklusive Abdichtung landet man hier schnell im vierstelligen Bereich, oft grob zwischen 1.500 und 3.000 Euro – je nach Fliese und Wandhöhe.',
          'Ein rechteckiger Wohnzimmerboden von 25 Quadratmetern mit mittelgroßen Feinsteinzeug-Fliesen im Verband ist deutlich günstiger pro Quadratmeter: Bei angenommenen 60 Euro pro Quadratmeter für Material und Verlegung liegt man grob bei rund 1.500 Euro. Den belastbaren Preis für Ihren Raum gibt es erst nach dem Blick vor Ort.',
        ],
      },
      {
        h2: 'Sparen ja – aber an der richtigen Stelle',
        paras: [
          'Sparen können Sie bei der Fliese: Es muss nicht die teuerste Designserie sein, gutes Feinsteinzeug im mittleren Preisbereich hält jahrzehntelang und sieht sauber aus. Und wer beim Format bei einer gängigen Größe im schlichten Verband bleibt, spart doppelt – an Material und an Arbeitszeit.',
          'Nicht sparen sollten Sie an der Untergrundvorbereitung, an der Abdichtung im Bad und an sauberer Verlegung. Das ist die Stelle, an der schlechte Arbeit erst später auffällt – und dann richtig teuer wird.',
        ],
      },
      {
        h2: 'Fliesen verlegen lassen im Raum Heilbronn',
        paras: [
          'Wir verlegen Boden- und Wandfliesen im gesamten Raum Heilbronn – von der einzelnen Wohnung bis zur kompletten Badsanierung, inklusive Untergrundvorbereitung, Abdichtung und Verfugen. Sauber verlegt, fair kalkuliert und mit verbindlichem Festpreis vor Baubeginn.',
          'Gerade im Bad greifen Fliesen, Abdichtung, Sanitär und Trockenbau ineinander. Auf Wunsch übernehmen wir das komplett aus einer Hand, mit einem Ansprechpartner. Erzählen Sie uns von Ihrem Projekt – wir schauen es uns an und sagen ehrlich, was drinsteckt.',
        ],
      },
    ],
  },
];

export function getPost(slug: string | undefined): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

// Themen-Gruppierung der Ratgeber-Übersicht (Schlüssel = relatedLeistung-Slug).
// Reihenfolge = Anzeige-Reihenfolge; leere Gruppen werden ausgelassen.
export interface BlogThema {
  key: string;
  title: string;
  blurb: string;
}
export const blogThemen: BlogThema[] = [
  { key: 'komplettsanierung', title: 'Sanierung & Planung', blurb: 'Ablauf, Kosten und Reihenfolge einer Sanierung – von der Aufnahme bis zur Übergabe.' },
  { key: 'bodenarbeiten', title: 'Böden', blurb: 'Vinyl, Laminat, Parkett und Estrich: Kosten, Vergleiche und worauf es beim Untergrund ankommt.' },
  { key: 'bad-sanitaer', title: 'Bad & Fliesen', blurb: 'Badsanierung, Fliesen und barrierefreie Lösungen – Kosten und Praxis.' },
  { key: 'wand-decke', title: 'Wände & Decken', blurb: 'Trockenbau, Maler- und Spachtelarbeiten: Preise und Abläufe.' },
  { key: 'einzelgewerke', title: 'Rund um die Wohnung', blurb: 'Übergabe, Kleinreparaturen und einzelne Gewerke – praktisch erklärt.' },
];

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
    title: 'Komplettsanierung Heilbronn zum Festpreis | SE Handwerk',
    description:
      'Ihre Immobilie komplett saniert — zum Festpreis, aus einer Hand. Ein Ansprechpartner koordiniert alle Gewerke bis zur Übergabe. Raum Heilbronn.',
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
