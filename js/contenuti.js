// ================================================================
//  1915-1918 · I CANTI AL FRONTE · contenuti
//  Domande, schede delle categorie, testi dei personaggi e regolazioni delle battaglie.
//  Si possono modificare liberamente: il motore di gioco è in js/gioco.js.
// ================================================================
window.CONTENUTI = {
  // ---------------------------------------------------------------
  //  Le 4 categorie dei canti: una per blocco di domande.
  //  "scheda" sono le caratteristiche della categoria, che si rivedono nel ripasso finale.
  // ---------------------------------------------------------------
  CATEGORIE: [
    {
      nome: "Canti di Esaltazione Patriottica",
      breve: "Esaltazione Patriottica",
      colore: "#b8402f",
      sfondo: "blocco-1",
      scheda: [
        "Li scrivevano gli <b>ufficiali</b>, non i soldati.",
        "Erano spesso <b>accompagnati dalle bande o dalle fanfare</b>.",
        "Avevano <b>due melodie diverse</b>: una per la strofa e una per il ritornello.",
        "Celebravano la patria e il coraggio di chi combatteva.",
      ],
    },
    {
      nome: "Canti di Marcia e Intrattenimento",
      breve: "Marcia e Intrattenimento",
      colore: "#c08a22",
      sfondo: "blocco-2",
      scheda: [
        "Servivano a <b>distrarsi durante i lunghi trasferimenti a piedi</b>.",
        "Li cantavano i soldati, ma <b>anche gli ufficiali</b> ne scrivevano parecchi.",
        "<b>A volte</b> erano accompagnati dalle bande o dalle fanfare.",
        "Erano canti <b>allegri e ritmati</b>, per tenere alto il morale.",
      ],
    },
    {
      nome: "Canti di Dolore",
      breve: "Dolore",
      colore: "#4e6a86",
      sfondo: "blocco-3",
      scheda: [
        "Esprimevano <b>le sofferenze patite in trincea</b>.",
        "Usavano un <b>linguaggio semplice</b>.",
        "Si cantavano in trincea <b>senza accompagnamento musicale</b>.",
      ],
    },
    {
      nome: "Canti di Contestazione e Rabbia",
      breve: "Contestazione e Rabbia",
      colore: "#7a2b2b",
      sfondo: "blocco-4",
      scheda: [
        "Li componevano i <b>soldati</b>.",
        "Usavano un <b>linguaggio semplice</b>.",
        "Si cantavano <b>a voce scoperta</b>, senza accompagnamento musicale.",
        "Davano voce alla rabbia e alla protesta contro la guerra.",
      ],
    },
  ],

  // Qualche data da ricordare (compaiono nel ripasso finale)
  DATE: [
    ["1915", "L'Italia entra nella Prima Guerra Mondiale."],
    ["24 ottobre 1917", "La disfatta di Caporetto: gli italiani si ritirano sul fiume Piave."],
    ["4 novembre 1918", "Per l'Italia finisce la Prima Guerra Mondiale."],
  ],

  // ---------------------------------------------------------------
  //  Domande: 4 per blocco, come nel progetto Scratch.
  //  scelte:    le risposte fra cui scegliere (la giusta è "giusta", contando da 0);
  //             l'ordine viene mescolato a ogni partita, tranne Vero/Falso e Sì/No.
  //  accettate: per la modalità "risposta da scrivere", le parole che bastano per dare
  //             la risposta per giusta (maiuscole, accenti e punteggiatura non contano).
  //  bene / male: cosa dice il soldato dopo la risposta giusta o sbagliata.
  // ---------------------------------------------------------------
  DOMANDE: [
    [
      {
        testo: "In quale anno è iniziata per l'Italia la Prima Guerra Mondiale?",
        scelte: ["1914", "1915", "1917", "1918"], giusta: 1,
        accettate: ["1915"],
        bene: "Giusto! L'Italia entrò in guerra nel 1915.",
        male: "Hhhmmm... io ricordo nel 1915!",
      },
      {
        testo: "I canti di Esaltazione Patriottica da chi erano scritti? Soldati oppure ufficiali?",
        scelte: ["Dai soldati", "Dagli ufficiali"], giusta: 1, fisse: true,
        accettate: ["ufficiali", "ufficiale"],
        bene: "Giusto! Li scrivevano gli ufficiali.",
        male: "Non proprio: erano gli ufficiali. Noi poveri soldati avevamo altro a cui pensare!",
      },
      {
        testo: "Questi canti non avevano l'accompagnamento musicale. Vero o falso?",
        scelte: ["Vero", "Falso"], giusta: 1, fisse: true,
        accettate: ["falso"],
        bene: "Giusto! Spesso erano accompagnati dalle bande o dalle fanfare.",
        male: "In realtà è falso, perché spesso erano accompagnati dalle bande o dalle fanfare.",
      },
      {
        testo: "Questi canti avevano una sola melodia, uguale per tutto il brano?",
        scelte: ["Sì, una sola melodia", "No, due melodie diverse"], giusta: 1, fisse: true,
        accettate: ["no", "due", "2"],
        bene: "Giusto! Una melodia per la strofa e una per il ritornello.",
        male: "Beh, di solito avevano 2 melodie diverse, una per la strofa e una per il ritornello.",
      },
    ],
    [
      {
        testo: "Come si chiama la categoria dei canti che usavamo per distrarci durante i nostri lunghi trasferimenti a piedi?",
        scelte: ["Esaltazione Patriottica", "Marcia e Intrattenimento", "Dolore", "Contestazione e Rabbia"], giusta: 1,
        accettate: ["marcia", "intrattenimento"],
        bene: "Giusto! Sono i canti di Marcia e Intrattenimento.",
        male: "Sono i canti di \"Marcia e Intrattenimento\".",
      },
      {
        testo: "Questi canti potevano essere scritti anche dagli ufficiali. Vero o falso?",
        scelte: ["Vero", "Falso"], giusta: 0, fisse: true,
        accettate: ["vero", "si"],
        bene: "Giusto! Anche gli ufficiali ne scrivevano parecchi.",
        male: "È vero: anche gli ufficiali ne scrivevano parecchi.",
      },
      {
        testo: "Questi canti a volte avevano anche l'accompagnamento musicale?",
        scelte: ["Sì, a volte", "No, mai"], giusta: 0, fisse: true,
        accettate: ["si", "vero", "a volte"],
        bene: "Giusto! A volte c'erano le bande o le fanfare.",
        male: "Invece sì: a volte erano accompagnati dalle bande o dalle fanfare.",
      },
      {
        testo: "Erano canti solitamente allegri e ritmati. Vero o falso?",
        scelte: ["Vero", "Falso"], giusta: 0, fisse: true,
        accettate: ["vero", "si"],
        bene: "Giusto! Ci distraevano e ci rallegravano durante le marce.",
        male: "È vero, per poterci distrarre e rallegrare durante le marce.",
      },
    ],
    [
      {
        testo: "Dopo i canti di Esaltazione e di Marcia, qual è la categoria in cui esprimevamo tutte le sofferenze che pativamo in trincea?",
        scelte: ["Esaltazione Patriottica", "Marcia e Intrattenimento", "Dolore", "Contestazione e Rabbia"], giusta: 2,
        accettate: ["dolore", "sofferenza"],
        bene: "Giusto! Sono i canti di Dolore.",
        male: "Sono i canti di \"Dolore\".",
      },
      {
        testo: "Com'era il linguaggio usato in questi canti?",
        scelte: ["Semplice", "Ricercato e solenne", "Tecnico e militare"], giusta: 0,
        accettate: ["semplice"],
        bene: "Giusto! Un linguaggio semplice.",
        male: "Era un linguaggio \"semplice\".",
      },
      {
        testo: "Questi canti avevano l'accompagnamento musicale?",
        scelte: ["Sì", "No"], giusta: 1, fisse: true,
        accettate: ["no", "falso"],
        bene: "Giusto! In trincea li cantavamo senza accompagnamento.",
        male: "No, in trincea li cantavamo senza accompagnamento.",
      },
      {
        testo: "In quale anno ci fu la disfatta di Caporetto, con la ritirata degli italiani sul fiume Piave?",
        scelte: ["1915", "1916", "1917", "1918"], giusta: 2,
        accettate: ["1917"],
        bene: "Giusto! Il 24 ottobre 1917.",
        male: "Hhhmmm... io ricordavo il 1917! Era il 24 ottobre.",
      },
    ],
    [
      {
        testo: "L'ultima categoria in cui dividiamo i canti è quella di Contestazione e Rabbia. Da chi erano composti questi canti?",
        scelte: ["Dai soldati", "Dagli ufficiali"], giusta: 0, fisse: true,
        accettate: ["soldati", "soldato"],
        bene: "Giusto! Eravamo noi soldati a comporli.",
        male: "Beh, eravamo noi soldati a comporli e a cantarli.",
      },
      {
        testo: "Com'era il linguaggio usato in questi canti?",
        scelte: ["Semplice", "Ricercato e solenne", "Tecnico e militare"], giusta: 0,
        accettate: ["semplice"],
        bene: "Giusto! Semplici soldati, linguaggio semplice.",
        male: "Semplici soldati = linguaggio \"semplice\"!",
      },
      {
        testo: "Questi canti erano soliti avere un accompagnamento musicale. Vero o falso?",
        scelte: ["Vero", "Falso"], giusta: 1, fisse: true,
        accettate: ["falso", "no"],
        bene: "Giusto! Li cantavamo a voce scoperta.",
        male: "In realtà no, li cantavamo a voce scoperta.",
      },
      {
        testo: "In che anno termina la Prima Guerra Mondiale?",
        scelte: ["1917", "1918", "1919", "1920"], giusta: 1,
        accettate: ["1918"],
        bene: "Giusto! Per l'Italia finisce il 4 novembre 1918.",
        male: "Intendevate il 1918, vero? Per l'Italia finisce il 4 novembre.",
      },
    ],
  ],

  // ---------------------------------------------------------------
  //  Gradi: dal punteggio (una munizione per ogni risposta giusta, massimo 16).
  //  "minimo" è il punteggio da cui si ottiene il grado; "img" è in assets/img/gradi/.
  // ---------------------------------------------------------------
  GRADI: [
    { nome: "Soldato semplice", minimo: 0, img: "00",
      finale: "Beh, Soldato {nome}, pare che ci si debba impegnare un po' di più e ripassare alcuni concetti fondamentali. Tornate presto a dimostrare il vostro vero valore." },
    { nome: "Caporale", minimo: 4, img: "01",
      finale: "Beh, Caporale {nome}, sicuramente potreste fare molto meglio di così. Ripassate alcuni concetti fondamentali e tornate presto a dimostrare il vostro vero valore." },
    { nome: "Caporal Maggiore", minimo: 6, img: "02",
      finale: "Caporal Maggiore {nome}, sono sicuro che aspiriate a gradi più elevati. Ripassate alcuni concetti fondamentali e tornate presto a dimostrare il vostro vero valore." },
    { nome: "Sergente", minimo: 7, img: "03",
      finale: "Sergente {nome}, siete a metà strada per il vero successo. Più concentrazione e farete molto meglio! Tornate presto a dimostrare il vostro vero valore." },
    { nome: "Sottotenente", minimo: 8, img: "04",
      finale: "Sottotenente {nome}, non va male ma potrebbe andare molto meglio! Tornate presto a dimostrare il vostro vero valore." },
    { nome: "Tenente", minimo: 10, img: "05",
      finale: "Tenente {nome}, bene! Non siete molto distanti dai gradi più ambiti! Tornate presto a dimostrare il vostro vero valore." },
    { nome: "Capitano", minimo: 12, img: "06",
      finale: "Capitano {nome}, un buon lavoro! Il grado di Generale (16 punti!) è lì che vi aspetta, tornate presto a dimostrare il vostro vero valore." },
    { nome: "Tenente-Colonnello", minimo: 14, img: "07",
      finale: "Tenente-Colonnello {nome}, molto bene! Siete quasi in vista del grado di Generale (16 punti!), tornate presto a dimostrare il vostro vero valore." },
    { nome: "Colonnello", minimo: 15, img: "08",
      finale: "Colonnello {nome}, ben fatto! Siete davvero ad un passo dal grado di Generale (16 punti!). Tornate presto a guadagnarvi il grado che vi spetta!" },
    { nome: "Generale", minimo: 16, img: "09",
      finale: "Generale {nome}, l'argomento per voi non ha più segreti! Ottimo lavoro!" },
  ],

  // ---------------------------------------------------------------
  //  Testi dell'ufficiale e del soldato. {nome} e {grado} vengono sostituiti.
  // ---------------------------------------------------------------
  TESTI: {
    intro: [
      "Bene soldato {nome}, siete qui per testare le vostre conoscenze riguardo i Canti della Prima Guerra Mondiale.",
      "Prima di ogni battaglia un soldato vi farà 4 domande su una categoria di canti: tenete a mente quello che avete studiato!",
      "Ogni risposta giusta vi dà una munizione per l'Artiglieria o la Contraerea, e vi fa salire di grado.",
      "In battaglia toccate il cannone, puntate la zona da colpire e fate fuoco. I colpi arrivano dopo qualche secondo: mirate dove il nemico starà, non dove è adesso!",
      "Poi bisogna attendere la ricarica: mi raccomando, non sprecate le munizioni!",
    ],
    saluto: "Salve {grado} {nome}!",
    // dopo le domande, secondo le munizioni conquistate (0, 1, 2, 3, 4)
    munizioniArtiglieria: [
      "Non potete andare in battaglia senza munizioni... ecco, vi concediamo solo 1 salva di artiglieria: usatela al momento giusto e speriamo che il fronte regga.",
      "Avete solo 1 salva di artiglieria a disposizione: usatela al momento giusto e speriamo che il fronte regga.",
      "Avete 2 salve di artiglieria a disposizione: usatele saggiamente per non subire troppi danni.",
      "Bene, avete 3 salve di artiglieria a disposizione: non dovreste avere troppi problemi a respingere il nemico.",
      "Molto bene, avete 4 salve di artiglieria a disposizione: non penso ci saranno problemi a respingere il nemico.",
    ],
    munizioniContraerea: [
      "Senza munizioni sarà difficile respingere gli apparecchi nemici. Purtroppo abbiamo potuto procurarvi solo 1 salva di contraerea: usatela al momento giusto e speriamo che il fronte regga.",
      "Avete solo 1 salva di contraerea a disposizione: usatela al momento giusto e speriamo che il fronte regga.",
      "Avete 2 salve di contraerea a disposizione: usatele saggiamente per non subire troppi danni.",
      "Avete 3 salve di contraerea a disposizione: se le usate correttamente dovrebbero bastare per non subire troppi danni.",
      "Molto bene, avete 4 salve di contraerea a disposizione: gli apparecchi nemici troveranno pane per i loro denti!",
    ],
    finale: [
      "Siamo giunti alla fine, {grado} {nome}.",
      "Il vostro punteggio finale è pari a {punti} su 16.",
    ],
  },

  // ---------------------------------------------------------------
  //  Battaglie (dopo ogni blocco di domande).
  //  durata in secondi, fronte = resistenza della linea del fronte,
  //  zona = "punti" (4 punti d'impatto) o "fascia" (una lunga striscia).
  //  Per ogni mezzo: percorso (le linee in js/grafica.js), quanti ne arrivano,
  //  velocità (passi Scratch per fotogramma, come nell'originale),
  //  danno alla linea del fronte se la raggiunge, grandezza in percentuale.
  // ---------------------------------------------------------------
  BATTAGLIE: [
    {
      titolo: "Arrivano i carri nemici!", tipo: "carri", arma: "artiglieria", zona: "punti",
      durata: 75, fronte: 30, sfondo: "campo",
      mezzi: [
        { mezzo: "mark-iv-m", nome: "Mark IV", percorso: "1", quanti: 10, velocita: 0.5, danno: 2, grandezza: 9 },
        { mezzo: "saint-chamond", nome: "Saint-Chamond", percorso: "2", quanti: 10, velocita: 0.8, danno: 1.5, grandezza: 7 },
        { mezzo: "renault", nome: "Renault FT", percorso: "3", quanti: 10, velocita: 0.8, danno: 1, grandezza: 8 },
      ],
    },
    {
      titolo: "Arrivano gli aerei nemici!", tipo: "aerei", arma: "contraerea", zona: "punti",
      durata: 75, fronte: 30, sfondo: "campo-nuvole",
      mezzi: [
        { mezzo: "fokker", nome: "Fokker", percorso: "Fokk", quanti: 10, velocita: 0.6, danno: 2, grandezza: 10 },
        { mezzo: "breguet", nome: "Breguet", percorso: "Breg", quanti: 10, velocita: 0.5, danno: 1.5, grandezza: 10 },
        { mezzo: "nieuport-2", nome: "Nieuport", percorso: "Nieu 2", quanti: 10, velocita: 0.8, danno: 1, grandezza: 10 },
      ],
    },
    {
      titolo: "I carri nemici sono più numerosi, ma abbiamo potenziato l'artiglieria. Occhio al loro percorso!",
      tipo: "carri", arma: "artiglieria", zona: "fascia",
      durata: 88, fronte: 50, sfondo: "campo",
      mezzi: [
        { mezzo: "mark-iv-m", nome: "Mark IV", percorso: "1", quanti: 12, velocita: 0.5, danno: 2, grandezza: 9 },
        { mezzo: "mark-iv-f", nome: "Mark IV", percorso: "4", quanti: 12, velocita: 0.8, danno: 2, grandezza: 9 },
        { mezzo: "saint-chamond", nome: "Saint-Chamond", percorso: "2", quanti: 10, velocita: 0.8, danno: 1.5, grandezza: 7 },
        { mezzo: "saint-chamond", nome: "Saint-Chamond", percorso: "5", quanti: 10, velocita: 0.7, danno: 1.5, grandezza: 7 },
        { mezzo: "renault", nome: "Renault FT", percorso: "3", quanti: 11, velocita: 0.8, danno: 1, grandezza: 8 },
        { mezzo: "renault", nome: "Renault FT", percorso: "6", quanti: 11, velocita: 0.8, danno: 1, grandezza: 8 },
      ],
    },
    {
      titolo: "Gli aerei nemici sono più numerosi, ma abbiamo potenziato la contraerea. Occhio al loro percorso!",
      tipo: "aerei", arma: "contraerea", zona: "fascia",
      durata: 88, fronte: 50, sfondo: "campo-nuvole",
      mezzi: [
        { mezzo: "fokker", nome: "Fokker", percorso: "Fokk", quanti: 11, velocita: 0.6, danno: 2, grandezza: 10 },
        { mezzo: "breguet", nome: "Breguet", percorso: "Breg", quanti: 12, velocita: 0.5, danno: 1.5, grandezza: 10 },
        { mezzo: "nieuport", nome: "Nieuport", percorso: "Nie", quanti: 11, velocita: 0.8, danno: 1, grandezza: 10 },
        { mezzo: "barone-rosso", nome: "Barone Rosso", percorso: "Red B", quanti: 12, velocita: 0.7, danno: 2.5, grandezza: 10 },
        { mezzo: "royal", nome: "Royal Aircraft", percorso: "Roy", quanti: 11, velocita: 0.9, danno: 1, grandezza: 10 },
        { mezzo: "nieuport-2", nome: "Nieuport", percorso: "Nieu 2", quanti: 11, velocita: 0.8, danno: 1, grandezza: 10 },
      ],
    },
  ],
};
