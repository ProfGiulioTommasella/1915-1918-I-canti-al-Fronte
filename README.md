# 1915-1918 · I Canti al Fronte

Gioco per ricordare le informazioni più importanti sulle **4 categorie dei canti della Prima Guerra Mondiale**:
canti di **Esaltazione Patriottica**, di **Marcia e Intrattenimento**, di **Dolore** e di **Contestazione e Rabbia**.

> Salve soldato! Prima di ogni battaglia un commilitone vi interroga sui canti di trincea:
> ogni risposta giusta è una munizione in più per l'artiglieria o la contraerea, e un passo verso il grado di Generale.

Il gioco è diviso in **4 blocchi**, uno per categoria. In ogni blocco:

1. si legge il **diario di trincea** con le caratteristiche della categoria (chi scriveva i canti,
   il linguaggio, l'accompagnamento musicale, la melodia, il carattere);
2. il soldato fa **4 domande** (a scelta multipla, oppure da scrivere come nello Scratch: si sceglie
   all'arruolamento). Dopo ogni risposta il soldato spiega quella giusta;
3. si vede il **grado** raggiunto (da Soldato semplice a Generale, 16 punti);
4. si combatte la **battaglia**: carri armati nel 1° e 3° blocco, aerei nel 2° e 4°.
   Le munizioni sono le risposte giuste del blocco (almeno una).

In battaglia i mezzi nemici seguono i percorsi del progetto Scratch verso la nostra linea del fronte,
a destra: chi la raggiunge la danneggia. Si tocca il cannone nel pannello, si punta la zona da colpire
e si fa fuoco; i colpi arrivano dopo qualche secondo, quindi bisogna **mirare dove passerà il nemico**.
Nelle prime due battaglie la zona è fatta di 4 punti d'impatto, nelle ultime due è una lunga fascia;
con **R** (o il pulsante ↻) la si ruota. Dopo ogni salva c'è la ricarica (il conto alla rovescia da 18 a 1).
Si vince se il fronte resiste fino alla fine del tempo o se nessun nemico resta in campo.

Alla fine c'è il **report delle battaglie** (una stella per ogni battaglia vinta), il saluto
dell'ufficiale secondo il grado e un **ripasso** con le 4 categorie, le date principali
e le domande sbagliate con la risposta giusta.

## Come si gioca

Funziona su PC, LIM e tablet in orizzontale. Sul PC si mira con il mouse e si spara con un clic
(barra spaziatrice per prendere il cannone, R per ruotare, Esc per annullare); sul tablet si trascina
la zona con il dito e si preme **FUOCO!**. Alle domande si risponde anche con i tasti 1-4, Invio per andare avanti.
In alto a destra 📜 apre le istruzioni (e mette in pausa la battaglia), 🎵 spegne i rumori di fondo,
🔊 gli effetti sonori e ⛶ mette il gioco a schermo intero.

## Pubblicarlo con GitHub Pages

1. Nel repository apri **Settings → Pages**.
2. In *Build and deployment* scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`.
3. Dopo un minuto il gioco è online all'indirizzo
   `https://profgiuliotommasella.github.io/1915-1918-I-canti-al-Fronte/`.

Si può anche giocare offline aprendo `index.html` nel browser.

Dopo una modifica ai file in `js/` o `css/`, aumenta di uno il numero `?v=` nelle righe
di `index.html` che li caricano: così i browser scaricano subito la versione nuova
invece di usare quella vecchia in memoria.

## Modificare domande e testi

I contenuti stanno in [`js/contenuti.js`](js/contenuti.js): le schede del diario di trincea, le 16 domande
(con le risposte fra cui scegliere, le parole accettate nella risposta scritta e cosa dice il soldato),
i gradi con il saluto finale dell'ufficiale, i dialoghi e le 4 battaglie (durata, resistenza del fronte,
mezzi nemici con quantità, velocità e danno, come nello Scratch).
I tempi del tiro (ritardo dei colpi, ricarica) si regolano in cima a [`js/gioco.js`](js/gioco.js).

Per provare subito una parte: `index.html#blocco=3`, `index.html#battaglia=4&munizioni=2`,
`index.html#report=1011` (battaglie vinte e perse), `index.html#finale&punti=13`.

## Cosa cambia rispetto al progetto Scratch

- Prima delle domande c'è il **diario di trincea** con le caratteristiche della categoria,
  e alla fine il **ripasso** con le 4 categorie, le date e le risposte da rivedere.
- Le domande si possono fare **a scelta multipla** (utile sul tablet) oppure **scritte** come nell'originale,
  e la risposta scritta è più tollerante (maiuscole, accenti e frasi intere: "erano canti di dolore!" va bene).
- Il soldato spiega sempre la risposta giusta; corretta la spiegazione della 3ª domanda del 2° blocco.
- I mezzi seguono i percorsi originali in modo fluido (niente più sensori rosso e blu) e prima della
  battaglia i percorsi si vedono per qualche secondo; i carri sollevano polvere, gli aerei in fiamme avvitano.
- I colpi lasciano crateri sul campo, con lampi, fumo, zolle di terra o schegge della contraerea;
  la zona lampeggia con il conto alla rovescia dell'arrivo.
- Pannello con linea del fronte, tempo, nemici rimasti, munizioni e ricarica.
- Report delle battaglie, esito di ogni battaglia con i dati, gradi con promozione.
- Grafiche in alta risoluzione dai file Canva, schermo intero, tablet e LIM.

## Struttura

```
index.html            pagina del gioco
css/stile.css         grafica dell'interfaccia
js/contenuti.js       domande, schede, gradi, testi e battaglie (da modificare liberamente)
js/grafica.js         misure delle immagini e percorsi dei mezzi (generato)
js/gioco.js           motore di gioco
assets/img/           sfondi, mezzi, gradi, personaggi e pulsanti (dal progetto Scratch e da Canva)
assets/audio/         i suoni del progetto Scratch
strumenti/estrai.py   rigenera assets e js/grafica.js dal file .sb3 (Pillow, svgpathtools, ffmpeg);
                      con la cartella dei file Canva (PNG 1920x1440 con lo stesso nome dei costumi)
                      come secondo argomento usa le versioni in alta risoluzione
```
