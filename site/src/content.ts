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
