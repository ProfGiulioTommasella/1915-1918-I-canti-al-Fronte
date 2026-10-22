// ================================================================
//  1915-1918 · I CANTI AL FRONTE · motore di gioco
//  Domande, testi e battaglie sono in js/contenuti.js,
//  misure delle immagini e percorsi dei mezzi in js/grafica.js (generato).
// ================================================================
(() => {
  "use strict";

  const C = window.CONTENUTI;
  const GRAFICA = window.GRAFICA;
  const PERCORSI = window.PERCORSI;

  const W = 1280;
  const H = 720;
  const CW = 960; // il campo di battaglia occupa la parte sinistra dello schermo
  const CH = 720;
  // Battaglia: i valori si possono regolare qui
  const RITARDO_COLPO = 4.5; // secondi fra il fuoco e l'arrivo dei colpi (nello Scratch circa 6)
  const DURATA_COLPI = 3.2; // secondi in cui cadono i colpi di una salva
  const RICARICA = 19; // secondi di ricarica dopo ogni salva, come nello Scratch
  const SCALA_MEZZI = 1.2; // i mezzi un po' più grandi che nello Scratch, per vederli meglio
  const ARRIVO_X = 938; // x della linea del fronte: chi la raggiunge la danneggia
  const PREAVVISO = 3; // secondi di conto alla rovescia (con i percorsi in vista) prima della battaglia
  // le zone di tiro, in pixel della scena e rispetto al punto in cui si mira
  const ZONA_PUNTI = [[32, -208], [-65, -25], [88, 79], [-54, 153]]; // 4 punti d'impatto (raggio 62)
  const RAGGIO_PUNTO = 62;
  const ZONA_FASCIA = [130, 470]; // larghezza e lunghezza della fascia

  const $ = (id) => document.getElementById(id);
  const schermo = $("schermo");
  const canvas = $("scena");
  const ctx = canvas.getContext("2d");
  const caso = (a, b) => a + Math.random() * (b - a);
  const scegli = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const limita = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------------------------------------------------------------
  //  Adattamento allo schermo (PC, tablet e LIM in orizzontale)
  // ---------------------------------------------------------------
  let k = 1; // scala interna del canvas
  let scalaSchermo = 1;
  function adatta() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    scalaSchermo = s;
    schermo.style.transform = `scale(${s})`;
    schermo.style.left = `${(window.innerWidth - W * s) / 2}px`;
    schermo.style.top = `${(window.innerHeight - H * s) / 2}px`;
    const dpr = window.devicePixelRatio || 1;
    k = Math.max(1, Math.min(2, s * dpr));
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
  }
  window.addEventListener("resize", adatta);
  window.addEventListener("orientationchange", () => setTimeout(adatta, 300));
  adatta();

  // ---------------------------------------------------------------
  //  Immagini
  // ---------------------------------------------------------------
  const img = {};
  function immagine(nome) {
    if (img[nome]) return img[nome];
    const im = new Image();
    let tentativi = 0;
    im.onerror = () => { if (tentativi++ < 3) setTimeout(() => { im.src = percorso(nome) + "&r=" + tentativi; }, 800); };
    im.src = percorso(nome);
    img[nome] = im;
    return im;
  }
  const percorso = (nome) => `assets/img/${nome}.${nome.startsWith("sfondi/") ? "jpg" : "png"}?v=1`;
  const pronta = (im) => im && im.complete && im.naturalWidth > 0;
  Object.keys(GRAFICA).forEach(immagine);
  ["titolo", "carta", "campo", "campo-nuvole", "trincea", "trincea-1", "trincea-2", "trincea-3", "fine",
    "blocco-1", "blocco-2", "blocco-3", "blocco-4", "aerea-persa", "aerea-vinta", "carri-persa", "carri-vinta",
    "report-perse", "report-vinte"].forEach((n) => immagine("sfondi/" + n));

  // disegna un'immagine di js/grafica.js con il suo centro in (x, y)
  function disegna(nome, x, y, ang = 0, s = 1, alfa = 1) {
    const im = img[nome];
    const m = GRAFICA[nome];
    if (!pronta(im) || !m) return;
    ctx.save();
    ctx.globalAlpha *= alfa;
    ctx.translate(x, y);
    if (ang) ctx.rotate(ang);
    ctx.drawImage(im, -m[2] * s, -m[3] * s, m[0] * s, m[1] * s);
    ctx.restore();
  }

  // sbuffi morbidi già pronti per fumo, polvere e fiamme
  function sbuffo(colore, bordo = 0) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, colore);
    gr.addColorStop(0.45 + bordo, colore.replace(/[\d.]+\)$/, "0.55)"));
    gr.addColorStop(1, colore.replace(/[\d.]+\)$/, "0)"));
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return c;
  }
  const SBUFFI = {
    fumo: sbuffo("rgba(70,66,60,1)"),
    fumoChiaro: sbuffo("rgba(150,144,132,1)"),
    nero: sbuffo("rgba(20,18,16,1)"),
    polvere: sbuffo("rgba(120,96,64,1)"),
    fuoco: sbuffo("rgba(255,170,60,1)"),
    lampo: sbuffo("rgba(255,245,200,1)"),
    nebbia: sbuffo("rgba(225,228,232,1)"),
  };

  // ---------------------------------------------------------------
  //  Suoni
  // ---------------------------------------------------------------
  const NOMI_SUONI = ["sconfitta", "vittoria", "colpo", "munizione", "carica", "start-arrivo", "start-via", "gradi",
    "fanfara", "sparo-artiglieria", "sparo-contraerea", "sirena", "boato-artiglieria", "boato-contraerea",
    "esplosioni", "pronto", "vuoto"];
  const leggi = (c, d = "0") => { try { return localStorage.getItem(c) || d; } catch (e) { return d; } };
  const scrivi = (c, v) => { try { localStorage.setItem(c, v); } catch (e) { /* niente */ } };
  let mutoEffetti = leggi("caf-muto-effetti") === "1";
  let mutoAtmosfera = leggi("caf-muto-atmosfera") === "1";

  // Gli effetti passano dalla Web Audio API (più affidabile su tablet e telefoni);
  // se la pagina è aperta da file, o il browser non la supporta, si usano gli <audio>.
  let actx = null;
  let volumeEffetti = null;
  function contesto() {
    if (actx) return actx;
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    volumeEffetti = actx.createGain();
    volumeEffetti.gain.value = mutoEffetti ? 0 : 1;
    volumeEffetti.connect(actx.destination);
    return actx;
  }
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* niente */ }

  const buffer = {};
  const suoni = {};
  const inCorso = {};
  function preparaSuoni() {
    const c = contesto();
    NOMI_SUONI.forEach((n) => {
      const file = `assets/audio/${n}.mp3`;
      const riserva = () => {
        if (suoni[n]) return;
        const a = new Audio(file);
        a.preload = "auto";
        suoni[n] = a;
      };
      if (!c || location.protocol === "file:" || !window.fetch) { riserva(); return; }
      fetch(file)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((dati) => new Promise((ok, ko) => { const p = c.decodeAudioData(dati, ok, ko); if (p && p.then) p.then(ok, ko); }))
        .then((b) => { buffer[n] = b; })
        .catch(riserva);
    });
  }

  let audioSbloccato = false;
  function sbloccaAudio() {
    const c = contesto();
    if (c && c.state !== "running") { try { c.resume(); } catch (e) { /* niente */ } }
    if (audioSbloccato) return;
    audioSbloccato = true;
    if (c) {
      try {
        const s = c.createBufferSource();
        s.buffer = c.createBuffer(1, 1, 22050);
        s.connect(c.destination);
        s.start(0);
      } catch (e) { /* niente */ }
    }
    aggiornaFondo();
  }
  preparaSuoni();
  ["pointerdown", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, sbloccaAudio, true));

  // insieme = true: il suono si sovrappone a quello già in corso (esplosioni)
  function suona(nome, volume = 1, velocita = 1, insieme = false) {
    if (mutoEffetti) return;
    if (buffer[nome] && actx) {
      try {
        if (actx.state !== "running") actx.resume();
        if (!insieme) zittisci(nome);
        const s = actx.createBufferSource();
        s.buffer = buffer[nome];
        s.playbackRate.value = velocita;
        const v = actx.createGain();
        v.gain.value = volume;
        s.connect(v).connect(volumeEffetti);
        s.onended = () => { if (inCorso[nome] === s) delete inCorso[nome]; };
        s.start();
        inCorso[nome] = s;
      } catch (e) { /* audio non disponibile */ }
      return;
    }
    if (!suoni[nome]) suoni[nome] = new Audio(`assets/audio/${nome}.mp3`);
    let a = suoni[nome];
    if (insieme && !a.paused) a = new Audio(a.src);
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = limita(volume, 0, 1);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* audio non disponibile */ }
  }
  function zittisci(nome) {
    if (inCorso[nome]) { try { inCorso[nome].stop(); } catch (e) { /* niente */ } delete inCorso[nome]; }
    const a = suoni[nome];
    if (a) { a.pause(); a.currentTime = 0; }
  }

  // Rumori di fondo: il fronte lontano durante domande e dialoghi, i motori in battaglia
  const FONDI = { "fronte-lontano": 0.22, carri: 0.32, aerei: 0.32, "start-attesa": 0.45 };
  const fondi = {};
  let fondoVoluto = null;
  function fondo(nome) {
    fondoVoluto = nome;
    aggiornaFondo();
  }
  function aggiornaFondo() {
    Object.keys(FONDI).forEach((n) => {
      const attivo = n === fondoVoluto && !mutoAtmosfera && audioSbloccato && !document.hidden;
      if (!attivo) { if (fondi[n]) fondi[n].pause(); return; }
      if (!fondi[n]) {
        fondi[n] = new Audio(`assets/audio/${n}.mp3`);
        fondi[n].loop = true;
      }
      fondi[n].volume = FONDI[n];
      if (fondi[n].paused) { const p = fondi[n].play(); if (p && p.catch) p.catch(() => {}); }
    });
  }
  document.addEventListener("visibilitychange", aggiornaFondo);

  function aggiornaPulsantiAudio() {
    $("btn-atmosfera").classList.toggle("spento", mutoAtmosfera);
    $("btn-atmosfera").title = mutoAtmosfera ? "Accendi i rumori di fondo" : "Spegni i rumori di fondo";
    $("btn-audio").classList.toggle("spento", mutoEffetti);
    $("btn-audio").textContent = mutoEffetti ? "🔇" : "🔊";
    $("btn-audio").title = mutoEffetti ? "Accendi gli effetti sonori" : "Spegni gli effetti sonori";
    Object.values(suoni).forEach((a) => { a.muted = mutoEffetti; });
    if (volumeEffetti) volumeEffetti.gain.value = mutoEffetti ? 0 : 1;
    if (mutoEffetti) NOMI_SUONI.forEach(zittisci);
    aggiornaFondo();
  }
  $("btn-atmosfera").addEventListener("click", () => {
    sbloccaAudio();
    mutoAtmosfera = !mutoAtmosfera;
    scrivi("caf-muto-atmosfera", mutoAtmosfera ? "1" : "0");
    aggiornaPulsantiAudio();
  });
  $("btn-audio").addEventListener("click", () => {
    mutoEffetti = !mutoEffetti;
    scrivi("caf-muto-effetti", mutoEffetti ? "1" : "0");
    aggiornaPulsantiAudio();
  });
  $("btn-schermo").addEventListener("click", () => {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } else {
      const el = d.documentElement;
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f) { const p = f.call(el); if (p && p.catch) p.catch(() => {}); }
    }
  });
  aggiornaPulsantiAudio();

  // ---------------------------------------------------------------
  //  Stato della partita
  // ---------------------------------------------------------------
  let stato = "titolo";
  let g = nuovaPartita();
  function nuovaPartita() {
    return {
      nome: leggi("caf-nome", ""),
      modo: leggi("caf-modo", "scelta"),
      punti: 0,
      blocco: 0,
      risposte: [], // per ogni blocco: [{ giusta, data }]
      munizioni: 0,
      vinte: 0,
      vinteQuali: [false, false, false, false],
      distrutti: 0,
    };
  }
  const gradoDa = (punti) => C.GRADI.reduce((r, gr) => (punti >= gr.minimo ? gr : r), C.GRADI[0]);
  const sostituisci = (t, extra = {}) => t
    .replace(/\{nome\}/g, g.nome)
    .replace(/\{grado\}/g, gradoDa(g.punti).nome)
    .replace(/\{punti\}/g, g.punti)
    .replace(/\{(\w+)\}/g, (m, c) => (c in extra ? extra[c] : m));

  // sfondo disegnato sul canvas fuori dalla battaglia
  let sfondo = "sfondi/titolo";
  let effetto = "nessuno"; // "pioggia", "cenere" o "nessuno"
  let tSfondo = 0;

  const PANNELLI = ["titolo", "arruolamento", "dialogo", "diario", "quiz", "grado", "banner", "esito", "report", "finale", "pannello"];
  function mostra(...quali) {
    PANNELLI.forEach((p) => $(p).classList.toggle("nascosto", !quali.includes(p)));
  }

  // ---------------------------------------------------------------
  //  Titolo e arruolamento
  // ---------------------------------------------------------------
  function titolo() {
    stato = "titolo";
    document.body.classList.remove("battaglia");
    sfondo = "sfondi/titolo";
    effetto = "nessuno";
    mostra("titolo");
    $("btn-istruzioni").classList.add("nascosto");
    const b = $("btn-start");
    b.classList.remove("arrivato", "via");
    fondo(null);
    setTimeout(() => {
      b.classList.add("arrivato");
      suona("start-arrivo", 0.6);
      setTimeout(() => { if (stato === "titolo") fondo("start-attesa"); }, 1900);
    }, 400);
  }
  $("btn-start").addEventListener("click", () => {
    const b = $("btn-start");
    if (stato !== "titolo" || b.classList.contains("via")) return;
    sbloccaAudio();
    fondo(null);
    b.classList.add("via");
    suona("start-via", 0.7);
    setTimeout(arruolamento, 1300);
  });

  function arruolamento() {
    stato = "arruolamento";
    sfondo = "sfondi/trincea-1";
    mostra("arruolamento");
    fondo("fronte-lontano");
    $("nome").value = g.nome;
    aggiornaModo();
    setTimeout(() => $("nome").focus(), 50);
  }
  function aggiornaModo() {
    document.querySelectorAll("#scelta-modo button").forEach((b) => b.classList.toggle("scelto", b.dataset.modo === g.modo));
  }
  document.querySelectorAll("#scelta-modo button").forEach((b) => b.addEventListener("click", () => {
    g.modo = b.dataset.modo;
    scrivi("caf-modo", g.modo);
    aggiornaModo();
  }));
  function arruola() {
    const n = $("nome").value.trim().replace(/\s+/g, " ");
    if (!n) { $("nome").focus(); $("nome").placeholder = "Scrivete il vostro nome!"; return; }
    g.nome = n.charAt(0).toUpperCase() + n.slice(1);
    scrivi("caf-nome", g.nome);
    $("nome").blur();
    intro();
  }
  $("btn-arruola").addEventListener("click", arruola);
  $("nome").addEventListener("keydown", (e) => { if (e.key === "Enter") arruola(); });

  // ---------------------------------------------------------------
  //  Dialoghi: l'ufficiale (a sinistra) e il soldato (a destra)
  // ---------------------------------------------------------------
  let dialogo = null;
  function parla(chi, righe, poi, opzioni = {}) {
    stato = "dialogo";
    dialogo = { righe, i: 0, poi, scritte: 0, testo: "", ultimo: opzioni.ultimo || "Avanti" };
    const d = $("dialogo");
    d.classList.toggle("soldato", chi === "soldato");
    $("dialogo-persona").src = chi === "soldato" ? "assets/img/soldato.png?v=1" : "assets/img/ufficiale.png?v=1";
    $("nuvola-chi").textContent = chi === "soldato" ? "Il soldato" : "L'ufficiale";
    $("btn-salta-intro").classList.toggle("nascosto", !opzioni.salta);
    mostra("dialogo");
    riga();
  }
  function riga() {
    dialogo.testo = sostituisci(dialogo.righe[dialogo.i]);
    dialogo.scritte = 0;
    $("btn-nuvola").textContent = dialogo.i === dialogo.righe.length - 1 ? dialogo.ultimo : "Avanti";
    $("nuvola-testo").textContent = "";
  }
  function avantiDialogo() {
    if (!dialogo) return;
    if (dialogo.scritte < dialogo.testo.length) { dialogo.scritte = dialogo.testo.length; return; }
    dialogo.i++;
    if (dialogo.i >= dialogo.righe.length) {
      const poi = dialogo.poi;
      dialogo = null;
      poi();
      return;
    }
    riga();
  }
  $("btn-nuvola").addEventListener("click", avantiDialogo);
  $("nuvola").addEventListener("click", (e) => { if (e.target.tagName !== "BUTTON") avantiDialogo(); });
  $("btn-salta-intro").addEventListener("click", () => {
    if (!dialogo) return;
    const poi = dialogo.poi;
    dialogo = null;
    poi();
  });
  function scriviDialogo(dt) {
    if (!dialogo || dialogo.scritte >= dialogo.testo.length) return;
    dialogo.scritte = Math.min(dialogo.testo.length, dialogo.scritte + dt * 55);
    $("nuvola-testo").textContent = dialogo.testo.slice(0, Math.floor(dialogo.scritte));
  }

  function intro() {
    sfondo = "sfondi/trincea-2";
    effetto = "nessuno";
    $("btn-istruzioni").classList.remove("nascosto");
    parla("ufficiale", C.TESTI.intro, () => blocco(0), { salta: true, ultimo: "Iniziamo!" });
  }

  // ---------------------------------------------------------------
  //  Istruzioni (mettono in pausa la battaglia)
  // ---------------------------------------------------------------
  let pausa = false;
  $("btn-istruzioni").addEventListener("click", () => {
    $("istruzioni").classList.remove("nascosto");
    pausa = true;
  });
  $("btn-chiudi-istruzioni").addEventListener("click", () => {
    $("istruzioni").classList.add("nascosto");
    pausa = false;
  });

  // ---------------------------------------------------------------
  //  Blocco: diario di trincea e domande del soldato
  // ---------------------------------------------------------------
  const DATE_DIARIO = ["24 maggio 1915", "agosto 1916", "novembre 1917", "ottobre 1918"];
  function blocco(i) {
    g.blocco = i;
    const cat = C.CATEGORIE[i];
    stato = "diario";
    document.body.classList.remove("battaglia");
    sfondo = "sfondi/" + cat.sfondo;
    effetto = i === 1 ? "nessuno" : i === 3 ? "cenere" : "pioggia";
    fondo("fronte-lontano");
    $("diario-blocco").textContent = `Diario di trincea · ${i + 1}° blocco`;
    $("diario-data").textContent = DATE_DIARIO[i];
    $("diario-titolo").textContent = cat.nome;
    $("diario-titolo").style.color = cat.colore;
    const ul = $("diario-punti");
    ul.innerHTML = "";
    cat.scheda.forEach((t, j) => {
      const li = document.createElement("li");
      li.innerHTML = t;
      li.style.animationDelay = `${0.3 + j * 0.45}s`;
      ul.appendChild(li);
    });
    mostra("diario");
  }
  $("btn-diario").addEventListener("click", () => { if (stato === "diario") iniziaQuiz(); });

  let quiz = null;
  function mescola(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function iniziaQuiz() {
    stato = "quiz";
    quiz = { n: 0, giuste: 0, risposte: [] };
    g.risposte[g.blocco] = quiz.risposte;
    mostra("quiz");
    $("quiz-categoria").textContent = `${g.blocco + 1}° blocco · ${C.CATEGORIE[g.blocco].nome}`;
    aggiornaMunizioniQuiz();
    domanda();
  }
  function aggiornaMunizioniQuiz() {
    const arma = C.BATTAGLIE[g.blocco].arma;
    $("quiz-munizioni-img").src = `assets/img/munizioni/${arma}-${quiz.giuste}.png?v=1`;
    $("quiz-munizioni-n").textContent = `${quiz.giuste} ${quiz.giuste === 1 ? "salva" : "salve"} di ${arma}`;
    const p = $("quiz-pallini");
    p.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      const el = document.createElement("i");
      if (i < quiz.risposte.length) el.className = quiz.risposte[i].giusta ? "giusta" : "sbagliata";
      else if (i === quiz.n) el.className = "ora";
      p.appendChild(el);
    }
  }
  function domanda() {
    const d = C.DOMANDE[g.blocco][quiz.n];
    quiz.attesa = true;
    const saluto = quiz.n === 0 ? sostituisci(C.TESTI.saluto) + " · " : "";
    $("quiz-numero").textContent = `${saluto}Domanda ${quiz.n + 1} di 4`;
    $("quiz-domanda").textContent = d.testo;
    $("quiz-esito").classList.add("nascosto");
    $("quiz-soldato").classList.remove("parla");
    void $("quiz-soldato").offsetWidth;
    $("quiz-soldato").classList.add("parla");
    const box = $("quiz-scelte");
    box.innerHTML = "";
    const scritta = g.modo === "scritta";
    box.classList.toggle("nascosto", scritta);
    $("quiz-scritta").classList.toggle("nascosto", !scritta);
    if (scritta) {
      $("quiz-input").value = "";
      $("quiz-input").disabled = false;
      setTimeout(() => $("quiz-input").focus(), 50);
    } else {
      const ordine = d.fisse ? d.scelte.map((t, i) => i) : mescola(d.scelte.map((t, i) => i));
      box.style.gridTemplateColumns = d.scelte.length === 3 ? "1fr" : "1fr 1fr";
      ordine.forEach((i, pos) => {
        const b = document.createElement("button");
        b.innerHTML = `<span class="tasto">${pos + 1}</span><span></span>`;
        b.lastChild.textContent = d.scelte[i];
        b.dataset.scelta = i;
        b.addEventListener("click", () => rispondi(i === d.giusta, b));
        box.appendChild(b);
      });
    }
    aggiornaMunizioniQuiz();
  }
  // per la risposta scritta: maiuscole, accenti e punteggiatura non contano
  const normalizza = (s) => ` ${s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;
  $("quiz-scritta").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!quiz || !quiz.attesa) return;
    const r = normalizza($("quiz-input").value);
    if (r.trim() === "") { $("quiz-input").focus(); return; }
    const d = C.DOMANDE[g.blocco][quiz.n];
    const ok = d.accettate.some((a) => r.includes(normalizza(a)));
    $("quiz-input").disabled = true;
    rispondi(ok, null);
  });
  function rispondi(giusta, bottone) {
    if (!quiz || !quiz.attesa) return;
    quiz.attesa = false;
    const d = C.DOMANDE[g.blocco][quiz.n];
    quiz.risposte.push({ giusta, d });
    document.querySelectorAll("#quiz-scelte button").forEach((b) => {
      b.disabled = true;
      if (Number(b.dataset.scelta) === d.giusta) b.classList.add("giusta");
    });
    if (bottone && !giusta) bottone.classList.add("sbagliata");
    if (giusta) {
      quiz.giuste++;
      // come nello Scratch: proiettile d'artiglieria o caricamento della contraerea
      suona(C.BATTAGLIE[g.blocco].arma === "artiglieria" ? "munizione" : "carica", 0.8);
      const m = $("quiz-munizioni");
      m.classList.remove("carica");
      void m.offsetWidth;
      m.classList.add("carica");
    } else {
      suona("vuoto", 0.7);
    }
    const t = $("quiz-esito-titolo");
    t.textContent = giusta ? "Giusto! +1 munizione" : "Sbagliato";
    t.className = giusta ? "giusta" : "sbagliata";
    $("quiz-esito-testo").textContent = giusta ? d.bene : d.male;
    $("quiz-esito").classList.remove("nascosto");
    $("btn-quiz-avanti").textContent = quiz.n === 3 ? "Fine domande" : "Avanti";
    quiz.n++;
    aggiornaMunizioniQuiz();
  }
  $("btn-quiz-avanti").addEventListener("click", () => {
    if (!quiz || quiz.attesa) return;
    if (quiz.n < 4) { domanda(); return; }
    fineQuiz();
  });
  function fineQuiz() {
    const prima = gradoDa(g.punti);
    g.punti += quiz.giuste;
    g.munizioni = Math.max(1, quiz.giuste);
    const b = C.BATTAGLIE[g.blocco];
    const testi = b.arma === "artiglieria" ? C.TESTI.munizioniArtiglieria : C.TESTI.munizioniContraerea;
    const promosso = gradoDa(g.punti) !== prima;
    sfondo = "sfondi/trincea-3";
    effetto = "nessuno";
    parla("soldato", [testi[quiz.giuste]], () => mostraGrado(promosso), { ultimo: "In battaglia! ▶" });
  }

  // ---------------------------------------------------------------
  //  Grado raggiunto
  // ---------------------------------------------------------------
  let timerGrado = 0;
  function mostraGrado(promosso) {
    stato = "grado";
    const gr = gradoDa(g.punti);
    $("grado-img").src = `assets/img/gradi/${gr.img}.png?v=1`;
    $("grado-img").style.animation = "none";
    void $("grado-img").offsetWidth;
    $("grado-img").style.animation = "";
    $("grado-sopra").textContent = promosso ? `Promosso! ${g.nome}, ora siete ${gr.nome}` : `${gr.nome} ${g.nome}`;
    $("grado-punti").textContent = `${g.punti} ${g.punti === 1 ? "punto" : "punti"} su 16`;
    mostra("grado");
    suona("gradi", 0.8);
    clearTimeout(timerGrado);
  }
  $("btn-grado").addEventListener("click", () => { if (stato === "grado") battaglia(g.blocco); });

  // ---------------------------------------------------------------
  //  Battaglia
  // ---------------------------------------------------------------
  let B = null; // la battaglia in corso
  const terreno = document.createElement("canvas"); // crateri e bruciature che restano sul campo
  terreno.width = CW;
  terreno.height = CH;
  const tctx = terreno.getContext("2d");

  function preparaPercorso(punti) {
    const lung = [0];
    for (let i = 1; i < punti.length; i++) {
      lung.push(lung[i - 1] + Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1]));
    }
    return { punti, lung, totale: lung[lung.length - 1] };
  }
  const PERC = {};
  Object.keys(PERCORSI).forEach((n) => { PERC[n] = preparaPercorso(PERCORSI[n]); });
  function puntoA(p, s) {
    s = limita(s, 0, p.totale);
    let a = 0;
    let b = p.lung.length - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (p.lung[m] < s) a = m; else b = m; }
    const t = (s - p.lung[a]) / (p.lung[b] - p.lung[a] || 1);
    return [p.punti[a][0] + (p.punti[b][0] - p.punti[a][0]) * t, p.punti[a][1] + (p.punti[b][1] - p.punti[a][1]) * t];
  }

  function battaglia(i) {
    const def = C.BATTAGLIE[i];
    stato = "battaglia";
    document.body.classList.add("battaglia");
    effetto = "nessuno";
    tctx.clearRect(0, 0, CW, CH);
    B = {
      i, def,
      t: -PREAVVISO, // tempo dall'inizio (prima è il conto alla rovescia)
      tempo: def.durata,
      fronte: def.fronte,
      mezzi: [],
      salve: [],
      scoppi: [],
      particelle: [],
      gruppi: def.mezzi.map((m) => ({ m, usciti: 0, prossimo: caso(0, 1.2) })),
      totale: def.mezzi.reduce((s, m) => s + m.quanti, 0),
      distrutti: 0,
      arrivati: 0,
      arma: "pronta",
      munizioni: g.munizioni,
      ricaricaFine: 0,
      mira: null, // { x, y } della zona mentre si mira
      ang: 0, // rotazione della zona
      scossa: 0,
      lampoFronte: 0,
      finita: false,
      nebbia: Array.from({ length: def.tipo === "aerei" ? 7 : 4 }, () => ({ x: caso(-200, CW), y: caso(0, 560), r: caso(140, 260), v: caso(6, 14) })),
    };
    fondo(def.tipo);
    mostra("pannello", "banner");
    $("pan-battaglia").textContent = `${i + 1}ª battaglia · ${def.tipo === "carri" ? "carri armati" : "aerei"}`;
    $("arma-nome").textContent = def.arma === "artiglieria" ? "Artiglieria" : "Contraerea";
    $("arma-img").src = `assets/img/${def.arma}.png?v=1`;
    const gr = gradoDa(g.punti);
    $("pan-grado-img").src = `assets/img/gradi/${gr.img}.png?v=1`;
    $("pan-nome").textContent = g.nome;
    $("pan-grado").textContent = gr.nome;
    $("banner-piccolo").textContent = def.titolo;
    $("banner-grande").textContent = "";
    aggiornaPannello();
  }

  function aggiornaPannello() {
    if (!B) return;
    const f = Math.max(0, B.fronte) / B.def.fronte;
    $("barra-fronte-pieno").style.width = `${f * 100}%`;
    $("barra-fronte").classList.toggle("medio", f <= 0.6 && f > 0.3);
    $("barra-fronte").classList.toggle("basso", f <= 0.3);
    $("n-fronte").textContent = `${Math.max(0, Math.round(B.fronte * 10) / 10)} / ${B.def.fronte}`;
    const s = Math.max(0, Math.ceil(B.tempo));
    $("tempo").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $("tempo").classList.toggle("poco", s <= 10);
    $("nemici").textContent = B.totale - B.distrutti - B.arrivati;
    $("arma-munizioni").src = `assets/img/munizioni/${B.def.arma}-${Math.min(4, B.munizioni)}.png?v=1`;
    const btn = $("btn-arma");
    btn.className = B.arma;
    const st = $("arma-stato");
    if (B.arma === "pronta") st.textContent = "PRONTA · TOCCA";
    else if (B.arma === "mira") st.textContent = "SCEGLI LA ZONA";
    else if (B.arma === "attesa") {
      const r = Math.max(0, B.ricaricaFine - B.t);
      // le cifre del conto alla rovescia dello Scratch (da 18 a 1)
      const n = String(limita(Math.ceil(r), 1, 18)).padStart(2, "0");
      if ($("arma-conto").dataset.n !== n) {
        $("arma-conto").dataset.n = n;
        $("arma-conto").src = `assets/img/conto/${n}.png?v=1`;
      }
    } else st.textContent = "SCARICA";
    $("btn-fuoco").classList.toggle("nascosto", !(B.arma === "mira" && B.mira && toccoUsato));
    $("btn-ruota").disabled = B.arma !== "mira";
  }

  function nuovoMezzo(m) {
    const p = PERC[m.percorso];
    B.mezzi.push({
      m, p,
      s: 0,
      x: p.punti[0][0], y: p.punti[0][1],
      ang: 0,
      vel: m.velocita * 60, // passi Scratch per fotogramma (30 al secondo) -> pixel della scena al secondo
      aereo: B.def.tipo === "aerei",
      stato: "vivo",
      t: 0,
      fase: Math.random() * 6.28,
    });
  }

  // il colpo: salva con punti d'impatto distribuiti nella zona
  function fuoco(x, y) {
    if (!B || B.arma !== "mira" || B.munizioni <= 0) return;
    B.munizioni--;
    B.arma = "attesa";
    B.ricaricaFine = B.t + RICARICA;
    B.mira = null;
    const salva = { x, y, ang: B.ang, tImpatto: B.t + RITARDO_COLPO, zona: B.def.zona, colpi: [], fischio: false, arrivata: false };
    const cos = Math.cos(B.ang);
    const sin = Math.sin(B.ang);
    const ruota = (dx, dy) => [x + dx * cos - dy * sin, y + dx * sin + dy * cos];
    if (salva.zona === "punti") {
      ZONA_PUNTI.forEach(([dx, dy]) => {
        for (let j = 0; j < 4; j++) {
          const a = caso(0, 6.28);
          const r = caso(0, RAGGIO_PUNTO - 30);
          const [cx, cy] = ruota(dx + Math.cos(a) * r, dy + Math.sin(a) * r);
          salva.colpi.push({ x: cx, y: cy, r: 48, t: caso(0, DURATA_COLPI) });
        }
      });
    } else {
      const n = 16;
      for (let j = 0; j < n; j++) {
        const dy = -ZONA_FASCIA[1] / 2 + ((j + caso(0.1, 0.9)) / n) * ZONA_FASCIA[1];
        const dx = caso(-ZONA_FASCIA[0] / 2 + 25, ZONA_FASCIA[0] / 2 - 25);
        const [cx, cy] = ruota(dx, dy);
        salva.colpi.push({ x: cx, y: cy, r: 50, t: caso(0, DURATA_COLPI) });
      }
    }
    salva.colpi.sort((a, b) => a.t - b.t);
    B.salve.push(salva);
    suona(B.def.arma === "artiglieria" ? "sparo-artiglieria" : "sparo-contraerea", 0.7);
    B.scossa = Math.max(B.scossa, 4);
    aggiornaPannello();
  }

  function scoppio(c, aereo) {
    B.scoppi.push({ x: c.x, y: c.y, r: c.r, t: 0, aereo });
    B.scossa = Math.max(B.scossa, aereo ? 3 : 6);
    const P = B.particelle;
    // lampo, palla di fuoco e fumo
    P.push({ tipo: "lampo", x: c.x, y: c.y, vx: 0, vy: 0, vita: 0.25, max: 0.25, r0: 30, r1: 110 });
    for (let j = 0; j < 6; j++) {
      P.push({ tipo: "fuoco", x: c.x + caso(-12, 12), y: c.y + caso(-12, 12), vx: caso(-40, 40), vy: caso(-40, 40), vita: caso(0.35, 0.6), max: 0.6, r0: 18, r1: 52 });
    }
    for (let j = 0; j < (aereo ? 3 : 6); j++) {
      // gli scoppi della contraerea lasciano sbuffi neri in cielo, l'artiglieria fumo a terra
      P.push({ tipo: aereo ? "nero" : "fumo", x: c.x + caso(-20, 20), y: c.y + caso(-20, 20), vx: caso(-18, 18) + 8, vy: caso(-26, 4), vita: caso(1.6, 2.6), max: 2.6, r0: 18, r1: aereo ? caso(40, 60) : caso(60, 95), alfa: aereo ? 0.5 : 0.55 });
    }
    if (aereo) {
      // schegge della granata a frammentazione
      for (let j = 0; j < 14; j++) {
        const a = caso(0, 6.28);
        const v = caso(180, 340);
        P.push({ tipo: "scheggia", x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vita: caso(0.2, 0.4), max: 0.4 });
      }
    } else {
      // zolle di terra che volano e ricadono
      for (let j = 0; j < 16; j++) {
        const a = caso(0, 6.28);
        const v = caso(60, 220);
        P.push({ tipo: "zolla", x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 80, vita: caso(0.5, 0.9), max: 0.9, gravita: 320, z: 0 });
      }
      P.push({ tipo: "polvere", x: c.x, y: c.y, vx: 0, vy: -10, vita: 1.6, max: 1.6, r0: 40, r1: 130, alfa: 0.55 });
      cratere(c.x, c.y, c.r * caso(0.55, 0.75));
    }
  }

  function cratere(x, y, r) {
    const gr = tctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    gr.addColorStop(0, "rgba(28,20,12,0.85)");
    gr.addColorStop(0.55, "rgba(52,38,22,0.7)");
    gr.addColorStop(0.8, "rgba(110,88,60,0.45)");
    gr.addColorStop(1, "rgba(110,88,60,0)");
    tctx.fillStyle = gr;
    tctx.beginPath();
    tctx.ellipse(x, y, r, r * 0.82, caso(0, 3), 0, 6.28);
    tctx.fill();
    tctx.fillStyle = "rgba(40,30,18,0.6)";
    for (let j = 0; j < 10; j++) {
      const a = caso(0, 6.28);
      const d = caso(r * 0.9, r * 1.5);
      tctx.beginPath();
      tctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, caso(1.5, 4), 0, 6.28);
      tctx.fill();
    }
  }
  function bruciatura(x, y, r) {
    const gr = tctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(10,8,6,0.75)");
    gr.addColorStop(0.6, "rgba(20,16,12,0.45)");
    gr.addColorStop(1, "rgba(20,16,12,0)");
    tctx.fillStyle = gr;
    tctx.beginPath();
    tctx.arc(x, y, r, 0, 6.28);
    tctx.fill();
  }

  function colpito(e) {
    e.stato = "colpito";
    e.t = 0;
    B.distrutti++;
    g.distrutti++;
    suona("colpo", 0.35, caso(0.7, 0.9), true);
    if (!e.aereo) bruciatura(e.x, e.y, 34 * (e.m.grandezza / 9));
  }

  function aggiornaBattaglia(dt) {
    if (!B || B.finita && B.t > B.fineT + 2.6) return;
    if (pausa) return;
    B.t += dt;
    B.scossa = Math.max(0, B.scossa - dt * 18);
    B.lampoFronte = Math.max(0, B.lampoFronte - dt * 2.5);
    B.nebbia.forEach((n) => { n.x += n.v * dt; if (n.x - n.r > CW) { n.x = -n.r; n.y = caso(0, 560); } });

    // conto alla rovescia iniziale
    if (B.t < 0) {
      const n = Math.ceil(-B.t);
      $("banner-grande").textContent = n;
      return;
    }
    if (!B.iniziata) {
      B.iniziata = true;
      $("banner-grande").textContent = "FUOCO!";
      setTimeout(() => { if (stato === "battaglia") $("banner").classList.add("nascosto"); }, 900);
    }

    if (!B.finita) {
      B.tempo -= dt;
      // arrivo dei mezzi nemici
      B.gruppi.forEach((gr) => {
        if (gr.usciti >= gr.m.quanti || B.t < gr.prossimo) return;
        nuovoMezzo(gr.m);
        gr.usciti++;
        gr.prossimo = B.t + caso(2.3, 4.5);
      });
      // ricarica
      if (B.arma === "attesa" && B.t >= B.ricaricaFine) {
        if (B.munizioni > 0) { B.arma = "pronta"; suona("pronto", 0.6); } else B.arma = "scarica";
      } else if (B.arma === "pronta" && B.munizioni <= 0) B.arma = "scarica";
    }

    // mezzi
    for (const e of B.mezzi) {
      e.t += dt;
      if (e.stato !== "vivo") continue;
      e.s += e.vel * dt;
      const [x, y] = puntoA(e.p, e.s);
      const [ax, ay] = puntoA(e.p, e.s - 10);
      const [bx, by] = puntoA(e.p, e.s + 10);
      e.x = x;
      e.y = y;
      const a = Math.atan2(by - ay, bx - ax);
      let d = a - e.ang;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      e.ang = e.t < 0.1 ? a : e.ang + d * Math.min(1, dt * 6);
      if (!e.aereo && Math.random() < dt * 6) {
        // polvere sollevata dai cingoli
        B.particelle.push({ tipo: "polvere", x: x - Math.cos(e.ang) * 26, y: y - Math.sin(e.ang) * 26, vx: caso(-6, 6), vy: caso(-8, 2), vita: 1.2, max: 1.2, r0: 6, r1: 26, alfa: 0.35 });
      }
      if (!B.finita && (e.x >= ARRIVO_X || e.s >= e.p.totale)) {
        e.stato = "arrivato";
        e.t = 0;
        B.arrivati++;
        B.fronte -= e.m.danno;
        B.lampoFronte = 1;
        B.scossa = Math.max(B.scossa, 3);
        suona("colpo", 0.6, caso(0.9, 1.1), true);
        $("barra-fronte").classList.remove("colpito");
        void $("barra-fronte").offsetWidth;
        $("barra-fronte").classList.add("colpito");
        for (let j = 0; j < 8; j++) {
          B.particelle.push({ tipo: "scintilla", x: ARRIVO_X + caso(-4, 6), y: e.y + caso(-14, 14), vx: caso(-120, -20), vy: caso(-90, 90), vita: caso(0.3, 0.6), max: 0.6 });
        }
      }
    }
    B.mezzi = B.mezzi.filter((e) => !(e.stato === "arrivato" || (e.stato === "colpito" && e.t > 2.4)));

    // salve in arrivo
    for (const s of B.salve) {
      const dall = B.t - s.tImpatto;
      if (!s.fischio && dall > -1.7) {
        s.fischio = true;
        suona("sirena", 0.35, 1.25, true);
      }
      if (dall < 0) continue;
      if (!s.arrivata) {
        s.arrivata = true;
        suona(B.def.arma === "artiglieria" ? "boato-artiglieria" : "boato-contraerea", 0.8, 1, true);
        suona("esplosioni", 0.6, 1, true);
      }
      s.colpi.forEach((c) => {
        if (!c.fatto && dall >= c.t) { c.fatto = true; scoppio(c, B.def.tipo === "aerei"); }
      });
    }
    B.salve = B.salve.filter((s) => !s.colpi.every((c) => c.fatto));

    // gli scoppi distruggono i mezzi vicini per un attimo
    for (const sc of B.scoppi) {
      sc.t += dt;
      if (sc.t > 0.75) continue;
      for (const e of B.mezzi) {
        if (e.stato !== "vivo") continue;
        const raggioMezzo = (e.aereo ? 22 : 24) * (e.m.grandezza / 9) * SCALA_MEZZI;
        if (Math.hypot(e.x - sc.x, e.y - sc.y) < sc.r + raggioMezzo) colpito(e);
      }
    }
    B.scoppi = B.scoppi.filter((sc) => sc.t < 0.75);

    // particelle
    for (const p of B.particelle) {
      p.vita -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravita) p.vy += p.gravita * dt;
      if (p.tipo === "fumo" || p.tipo === "nero" || p.tipo === "polvere") { p.vx *= 1 - dt * 0.6; p.vy *= 1 - dt * 0.6; }
    }
    B.particelle = B.particelle.filter((p) => p.vita > 0);
    // fumo dai rottami e dagli aerei in fiamme
    for (const e of B.mezzi) {
      if (e.stato === "colpito" && Math.random() < dt * (e.aereo ? 30 : 12)) {
        B.particelle.push({ tipo: e.aereo ? "nero" : "fumo", x: e.x + caso(-6, 6), y: e.y + caso(-6, 6), vx: caso(-10, 10) + 10, vy: caso(-30, -10), vita: 1.6, max: 1.6, r0: 8, r1: 34, alfa: 0.6 });
      }
    }

    // fine della battaglia
    if (!B.finita) {
      const tuttiUsciti = B.gruppi.every((gr) => gr.usciti >= gr.m.quanti);
      const nessunoInCampo = !B.mezzi.some((e) => e.stato === "vivo");
      if (B.fronte <= 0.4) finisci(false);
      else if (B.tempo <= 0 || (tuttiUsciti && nessunoInCampo)) finisci(true);
    }
    aggiornaPannello();
  }

  function finisci(vinta) {
    B.finita = true;
    B.vinta = vinta;
    B.fineT = B.t;
    B.arma = B.arma === "mira" ? "pronta" : B.arma;
    B.mira = null;
    if (vinta) g.vinte++;
    g.vinteQuali[B.i] = vinta;
    fondo(null);
    suona(vinta ? "vittoria" : "sconfitta", 0.9);
    $("banner-piccolo").textContent = vinta ? "Il fronte ha retto!" : "Il fronte è stato sfondato...";
    $("banner-grande").textContent = vinta ? "BATTAGLIA VINTA" : "BATTAGLIA PERSA";
    $("banner").classList.remove("nascosto");
    setTimeout(esito, 2600);
  }

  function esito() {
    if (!B) return;
    stato = "esito";
    document.body.classList.remove("battaglia");
    const nome = `${B.def.tipo === "carri" ? "carri" : "aerea"}-${B.vinta ? "vinta" : "persa"}`;
    $("esito-img").src = `assets/img/sfondi/${nome}.jpg?v=1`;
    $("esito-dati").innerHTML =
      `${B.def.tipo === "carri" ? "Carri" : "Aerei"} distrutti: <b>${B.distrutti}</b> su ${B.totale}<br>` +
      `Hanno raggiunto il fronte: <b>${B.arrivati}</b><br>` +
      `Linea del fronte: <b>${Math.max(0, Math.round((B.fronte / B.def.fronte) * 100))}%</b>`;
    $("btn-esito").textContent = B.i < 3 ? "Avanti ▶" : "Rapporto finale ▶";
    mostra("esito");
  }
  $("btn-esito").addEventListener("click", () => {
    if (stato !== "esito") return;
    const i = B.i;
    B = null;
    if (i < 3) blocco(i + 1);
    else report();
  });

  // ---------------------------------------------------------------
  //  Report delle battaglie: una stella per ogni battaglia vinta
  // ---------------------------------------------------------------
  // le stelle nel file Canva (1920x1440): tre in alto, la quarta sotto
  const STELLE = [[327, 554, 731, 952], [832, 554, 1236, 952], [1331, 554, 1735, 952], [832, 1020, 1236, 1402]];
  let tReport = 0;
  function report() {
    stato = "report";
    tReport = 0;
    g.stelle = g.vinteQuali.map(() => false);
    mostra("report");
    fondo("fronte-lontano");
  }
  function disegnaReport(dt) {
    tReport += dt;
    const perse = img["sfondi/report-perse"];
    const vinte = img["sfondi/report-vinte"];
    ctx.fillStyle = "#1a140c";
    ctx.fillRect(0, 0, W, H);
    if (!pronta(perse) || !pronta(vinte)) return;
    // tutto il foglio in vista (960x720 al centro), ai lati lo stesso foglio scurito
    ctx.globalAlpha = 0.35;
    ctx.drawImage(perse, 0, -120, 1280, 960);
    ctx.globalAlpha = 1;
    const s = 0.5;
    const ox = (W - 1920 * s) / 2;
    ctx.drawImage(perse, ox, 0, 1920 * s, 1440 * s);
    STELLE.forEach(([x0, y0, x1, y1], i) => {
      if (!g.vinteQuali[i]) return;
      const t = tReport - 0.8 - i * 0.7;
      if (t < 0) return;
      if (!g.stelle[i]) { g.stelle[i] = true; suona("colpo", 0.8); suona("munizione", 0.6, 1, true); }
      const z = 1 + Math.max(0, 0.25 - t) * 4; // la stella arriva come un timbro
      const w = (x1 - x0) * s;
      const h = (y1 - y0) * s;
      const cx = ox + (x0 + x1) / 2 * s;
      const cy = (y0 + y1) / 2 * s;
      ctx.globalAlpha = Math.min(1, t * 5);
      ctx.drawImage(vinte, x0, y0, x1 - x0, y1 - y0, cx - (w * z) / 2, cy - (h * z) / 2, w * z, h * z);
      ctx.globalAlpha = 1;
    });
  }
  $("btn-report").addEventListener("click", () => { if (stato === "report") finale(); });

  // ---------------------------------------------------------------
  //  Mira: mouse sul PC, dito sul tablet (trascina la zona e premi FUOCO!)
  // ---------------------------------------------------------------
  let toccoUsato = false;
  function puntoScena(e) {
    const r = schermo.getBoundingClientRect();
    return [(e.clientX - r.left) / scalaSchermo, (e.clientY - r.top) / scalaSchermo];
  }
  const limitaMira = ([x, y]) => [limita(x, 40, CW - 30), limita(y, 30, 600)];
  function prendiArma() {
    if (!B || B.finita || B.t < 0 || pausa) return;
    if (B.arma === "pronta") {
      B.arma = "mira";
      B.mira = toccoUsato ? [CW / 2, 300] : null;
      suona("carica", 0.5);
    } else if (B.arma === "mira") {
      B.arma = "pronta";
      B.mira = null;
    } else if (B.arma === "attesa") suona("vuoto", 0.5);
    aggiornaPannello();
  }
  $("btn-arma").addEventListener("click", prendiArma);
  $("btn-ruota").addEventListener("click", () => ruotaZona());
  $("btn-fuoco").addEventListener("click", () => { if (B && B.mira) fuoco(B.mira[0], B.mira[1]); });
  function ruotaZona() {
    if (!B || B.arma !== "mira") return;
    B.ang += Math.PI / 4;
  }
  canvas.addEventListener("pointermove", (e) => {
    if (!B || B.arma !== "mira") return;
    if (e.pointerType === "mouse") toccoUsato = false;
    const p = puntoScena(e);
    if (p[0] > CW) return;
    if (e.pointerType !== "mouse" && !e.buttons) return;
    B.mira = limitaMira(p);
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") toccoUsato = true;
    if (!B || B.arma !== "mira" || pausa) return;
    const p = puntoScena(e);
    if (p[0] > CW) return;
    if (e.pointerType === "mouse") fuoco(...limitaMira(p));
    else { B.mira = limitaMira(p); aggiornaPannello(); }
  });

  // ---------------------------------------------------------------
  //  Finale e ripasso
  // ---------------------------------------------------------------
  function finale() {
    stato = "dialogo";
    sfondo = "sfondi/fine";
    effetto = "nessuno";
    fondo(null);
    suona("fanfara", 0.8);
    const gr = gradoDa(g.punti);
    parla("ufficiale", [...C.TESTI.finale, gr.finale], rapporto, { ultimo: "Rapporto ▶" });
  }
  function rapporto() {
    stato = "finale";
    sfondo = "sfondi/carta";
    const gr = gradoDa(g.punti);
    $("finale-grado-img").src = `assets/img/gradi/${gr.img}.png?v=1`;
    $("finale-titolo").textContent = `${gr.nome} ${g.nome}`;
    $("finale-dati").innerHTML =
      `Punteggio finale: <b>${g.punti}</b> su 16<br>` +
      `Battaglie vinte: <b>${g.vinte}</b> su 4 · Mezzi nemici distrutti: <b>${g.distrutti}</b>`;
    $("finale-categorie").innerHTML = C.CATEGORIE.map((c) =>
      `<div class="cat" style="--c:${c.colore}"><h4>${c.nome}</h4><ul>${c.scheda.map((t) => `<li>${t}</li>`).join("")}</ul></div>`).join("");
    $("finale-date").innerHTML = C.DATE.map(([d, t]) => `<div><b>${d}</b>${t}</div>`).join("");
    const errori = [];
    g.risposte.forEach((r) => (r || []).forEach(({ giusta, d }) => {
      if (!giusta) errori.push(`<li>${d.testo} <em>${d.scelte[d.giusta]}</em></li>`);
    }));
    $("finale-errori").innerHTML = errori.length
      ? `<h3>Da ripassare</h3><ul>${errori.join("")}</ul>`
      : "<h3>Nessun errore: complimenti!</h3>";
    mostra("finale");
    $("finale").scrollTop = 0;
    fondo("fronte-lontano");
  }
  $("btn-rigioca").addEventListener("click", () => {
    const nome = g.nome;
    const modo = g.modo;
    g = nuovaPartita();
    g.nome = nome;
    g.modo = modo;
    blocco(0);
  });

  // ---------------------------------------------------------------
  //  Tastiera
  // ---------------------------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const key = e.key.toLowerCase();
    if (!$("istruzioni").classList.contains("nascosto")) {
      if (key === "enter" || key === "escape") $("btn-chiudi-istruzioni").click();
      return;
    }
    if (stato === "titolo" && (key === "enter" || key === " ")) $("btn-start").click();
    else if (stato === "dialogo" && (key === "enter" || key === " ")) { e.preventDefault(); avantiDialogo(); }
    else if (stato === "diario" && key === "enter") $("btn-diario").click();
    else if (stato === "quiz") {
      if (quiz && quiz.attesa && /^[1-4]$/.test(key)) {
        const b = document.querySelectorAll("#quiz-scelte button")[Number(key) - 1];
        if (b) b.click();
      } else if (quiz && !quiz.attesa && key === "enter") $("btn-quiz-avanti").click();
    } else if (stato === "grado" && key === "enter") $("btn-grado").click();
    else if (stato === "esito" && key === "enter") $("btn-esito").click();
    else if (stato === "report" && key === "enter") $("btn-report").click();
    else if (stato === "battaglia" && B) {
      if (key === "r") ruotaZona();
      else if (key === " " || key === "a") { e.preventDefault(); prendiArma(); }
      else if (key === "escape" && B.arma === "mira") prendiArma();
    }
  });

  // ---------------------------------------------------------------
  //  Disegno
  // ---------------------------------------------------------------
  const gocce = Array.from({ length: 140 }, () => ({ x: caso(0, W), y: caso(0, H), v: caso(600, 900), l: caso(10, 22) }));
  const fiocchi = Array.from({ length: 70 }, () => ({ x: caso(0, W), y: caso(0, H), v: caso(15, 40), r: caso(1, 2.6), f: caso(0, 6) }));

  function disegnaSfondo(dt) {
    tSfondo += dt;
    const im = img[sfondo];
    ctx.fillStyle = "#0d0b07";
    ctx.fillRect(0, 0, W, H);
    if (pronta(im)) {
      const iw = im.naturalWidth;
      const ih = im.naturalHeight;
      if (sfondo === "sfondi/titolo" || sfondo === "sfondi/carta") {
        // i fogli di carta si vedono interi; ai lati lo stesso foglio, scurito
        const sc = Math.max(W / iw, H / ih);
        ctx.drawImage(im, (W - iw * sc) / 2, (H - ih * sc) / 2, iw * sc, ih * sc);
        ctx.fillStyle = "rgba(10,7,3,0.6)";
        ctx.fillRect(0, 0, W, H);
        const s2 = H / ih;
        ctx.drawImage(im, (W - iw * s2) / 2, 0, iw * s2, H);
      } else {
        // lento movimento di macchina sugli sfondi fotografici
        const z = 1.04 + 0.03 * Math.sin(tSfondo * 0.05);
        const sc = Math.max(W / iw, H / ih) * z;
        const w = iw * sc;
        const h = ih * sc;
        const ox = Math.sin(tSfondo * 0.07) * (w - W) * 0.45;
        // le scene con la trincea in primo piano restano appoggiate in basso
        const oy = sfondo.startsWith("sfondi/trincea-") ? H - h : (H - h) / 2;
        ctx.drawImage(im, (W - w) / 2 + ox, oy, w, h);
      }
    }
    if (stato === "quiz" || stato === "diario" || stato === "dialogo" || stato === "arruolamento") {
      // vignettatura per leggere meglio
      const gr = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 820);
      gr.addColorStop(0, "rgba(0,0,0,0.05)");
      gr.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
    if (effetto === "pioggia") {
      ctx.strokeStyle = "rgba(200,210,220,0.28)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of gocce) {
        d.y += d.v * dt;
        d.x -= d.v * 0.18 * dt;
        if (d.y > H) { d.y = -20; d.x = caso(0, W + 100); }
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.l * 0.18, d.y - d.l);
      }
      ctx.stroke();
    } else if (effetto === "cenere") {
      ctx.fillStyle = "rgba(230,220,200,0.55)";
      for (const f of fiocchi) {
        f.y += f.v * dt;
        f.f += dt;
        f.x += Math.sin(f.f) * 12 * dt + 6 * dt;
        if (f.y > H) { f.y = -5; f.x = caso(0, W); }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.28);
        ctx.fill();
      }
    }
  }

  function disegnaParticella(p) {
    const f = 1 - p.vita / p.max; // da 0 a 1
    if (p.tipo === "scheggia") {
      ctx.strokeStyle = `rgba(255,220,150,${p.vita / p.max})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();
      return;
    }
    if (p.tipo === "scintilla") {
      ctx.fillStyle = `rgba(255,200,90,${p.vita / p.max})`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      return;
    }
    if (p.tipo === "zolla") {
      ctx.fillStyle = `rgba(60,42,24,${Math.min(1, (p.vita / p.max) * 2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6, 0, 6.28);
      ctx.fill();
      return;
    }
    const sb = { lampo: SBUFFI.lampo, fuoco: SBUFFI.fuoco, fumo: SBUFFI.fumo, nero: SBUFFI.nero, polvere: SBUFFI.polvere }[p.tipo];
    const r = p.r0 + (p.r1 - p.r0) * Math.sqrt(f);
    let a;
    if (p.tipo === "lampo") a = 1 - f;
    else if (p.tipo === "fuoco") a = (1 - f) * 0.95;
    else a = (p.alfa || 0.6) * Math.min(1, f * 6) * (1 - f);
    ctx.globalAlpha = limita(a, 0, 1);
    if (p.tipo === "lampo" || p.tipo === "fuoco") ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(sb, p.x - r, p.y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  function disegnaMezzo(e) {
    const base = e.m.mezzo;
    const s = (e.m.grandezza / 100) * SCALA_MEZZI;
    if (e.aereo) {
      // leggero ondeggiare in volo
      const bob = 1 + 0.03 * Math.sin(B.t * 3 + e.fase);
      if (e.stato === "vivo") disegna(`mezzi/${base}`, e.x, e.y, e.ang, s * bob);
      else if (e.t < 1.1) {
        // in fiamme: avvita e precipita (nello Scratch: 11 giri da 30° rimpicciolendo)
        disegna(`mezzi/${base}-fuoco`, e.x, e.y, e.ang + e.t * 5.2, s * (1 - e.t * 0.4));
      } else {
        disegna(`mezzi/${base}-boom`, e.x, e.y, e.ang, s * 0.6, Math.max(0, 1 - (e.t - 1.1) / 0.8));
        if (!e.schianto) {
          e.schianto = true;
          bruciatura(e.x, e.y, 22);
          B.particelle.push({ tipo: "fuoco", x: e.x, y: e.y, vx: 0, vy: 0, vita: 0.4, max: 0.4, r0: 10, r1: 40 });
        }
      }
      return;
    }
    if (e.stato === "vivo") {
      // il carro sobbalza un po' sul terreno
      const sob = Math.sin(B.t * 18 + e.fase) * 0.6;
      disegna(`mezzi/${base}`, e.x, e.y + sob, e.ang, s);
      return;
    }
    // esplosione in 4 fasi (0,2 secondi ciascuna) e poi il rottame che svanisce
    const fase = Math.min(4, 1 + Math.floor(e.t / 0.2));
    const alfa = e.t < 0.8 ? 1 : Math.max(0, 1 - (e.t - 0.8) / 1.6);
    disegna(`mezzi/${base}-${fase}`, e.x, e.y, e.ang, s, alfa);
  }

  function disegnaZona(x, y, ang, zona, alfa, colore) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = alfa;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = colore;
    ctx.fillStyle = colore.replace(/[\d.]+\)$/, "0.16)");
    if (zona === "punti") {
      ZONA_PUNTI.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx, dy, RAGGIO_PUNTO, 0, 6.28);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(dx - 10, dy); ctx.lineTo(dx + 10, dy);
        ctx.moveTo(dx, dy - 10); ctx.lineTo(dx, dy + 10);
        ctx.stroke();
        ctx.setLineDash([12, 8]);
      });
    } else {
      const [w, h] = ZONA_FASCIA;
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.fill();
      ctx.stroke();
      // strisce di pericolo
      ctx.setLineDash([]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.clip();
      ctx.strokeStyle = colore.replace(/[\d.]+\)$/, "0.3)");
      ctx.lineWidth = 10;
      for (let j = -h; j < h; j += 34) {
        ctx.beginPath();
        ctx.moveTo(-w / 2, j);
        ctx.lineTo(w / 2, j + w);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function disegnaBattaglia() {
    const sx = B.scossa ? caso(-B.scossa, B.scossa) : 0;
    const sy = B.scossa ? caso(-B.scossa, B.scossa) : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CW, CH);
    ctx.clip();
    ctx.translate(sx, sy);
    const im = img["sfondi/" + B.def.sfondo];
    if (pronta(im)) ctx.drawImage(im, -6, -6, CW + 12, CH + 12);
    ctx.drawImage(terreno, 0, 0);

    // i percorsi si vedono durante il conto alla rovescia, e svaniscono all'inizio
    const vista = B.t < 0 ? 1 : Math.max(0, 1 - B.t / 2);
    if (vista > 0) {
      ctx.save();
      ctx.globalAlpha = 0.75 * vista;
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 10]);
      ctx.strokeStyle = "rgba(255,90,60,1)";
      const usati = new Set(B.def.mezzi.map((m) => m.percorso));
      usati.forEach((n) => {
        const pts = PERC[n].punti;
        ctx.beginPath();
        pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      });
      ctx.restore();
    }

    // la linea del fronte (i sacchi a destra, nella trincea) si arrossa quando viene colpita
    ctx.save();
    const lampo = B.lampoFronte;
    if (lampo > 0) {
      const gr = ctx.createLinearGradient(CW - 120, 0, CW, 0);
      gr.addColorStop(0, "rgba(255,40,20,0)");
      gr.addColorStop(1, `rgba(255,40,20,${0.45 * lampo})`);
      ctx.fillStyle = gr;
      ctx.fillRect(CW - 120, 0, 120, CH);
    }
    ctx.restore();

    // carri sotto il fumo, aerei sopra
    const carri = B.mezzi.filter((e) => !e.aereo);
    const aerei = B.mezzi.filter((e) => e.aereo);
    carri.forEach(disegnaMezzo);
    B.particelle.filter((p) => p.tipo !== "nero" && p.tipo !== "scheggia").forEach(disegnaParticella);
    // nebbia e nuvole che passano
    B.nebbia.forEach((n) => {
      ctx.globalAlpha = B.def.tipo === "aerei" ? 0.18 : 0.1;
      ctx.drawImage(SBUFFI.nebbia, n.x - n.r, n.y - n.r * 0.6, n.r * 2, n.r * 1.2);
    });
    ctx.globalAlpha = 1;
    aerei.forEach(disegnaMezzo);
    B.particelle.filter((p) => p.tipo === "nero" || p.tipo === "scheggia").forEach(disegnaParticella);

    // salve in arrivo: la zona lampeggia con il tempo che manca
    for (const s of B.salve) {
      const manca = s.tImpatto - B.t;
      if (manca > 0) {
        const lamp = 0.55 + 0.35 * Math.sin(B.t * (manca < 1.5 ? 22 : 9));
        disegnaZona(s.x, s.y, s.ang, s.zona, lamp, "rgba(255,70,40,0.95)");
        ctx.save();
        ctx.strokeStyle = "rgba(255,230,160,0.95)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 30, -Math.PI / 2, -Math.PI / 2 + 6.283 * (manca / RITARDO_COLPO));
        ctx.stroke();
        ctx.fillStyle = "rgba(20,14,8,0.8)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, 24, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = "#ffe7a6";
        ctx.font = "22px 'Black Ops One', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.ceil(manca), s.x, s.y + 1);
        ctx.restore();
      }
    }
    // la zona mentre si mira
    if (B.arma === "mira" && B.mira) {
      disegnaZona(B.mira[0], B.mira[1], B.ang, B.def.zona, 0.9, "rgba(255,215,90,0.95)");
    }

    // trincea in primo piano
    disegna("trincea-bordo", 480, 360, 0, 1);
    ctx.restore();

    if (pausa) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, CW, CH);
    }
  }

  // il cursore del mouse diventa un mirino quando si mira
  function aggiornaCursore() {
    canvas.style.cursor = B && B.arma === "mira" ? "crosshair" : "default";
  }

  let ultimo = performance.now();
  function ciclo(ora) {
    const dt = Math.min(0.05, (ora - ultimo) / 1000);
    ultimo = ora;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    scriviDialogo(dt);
    if (stato === "battaglia" && B) {
      aggiornaBattaglia(dt);
      disegnaBattaglia();
      aggiornaCursore();
    } else if (stato === "report") {
      disegnaReport(dt);
    } else {
      disegnaSfondo(dt);
    }
    requestAnimationFrame(ciclo);
  }
  requestAnimationFrame(ciclo);

  // ---------------------------------------------------------------
  //  Avvio (index.html#battaglia=2 per provare subito una battaglia, #blocco=3 per un blocco)
  // ---------------------------------------------------------------
  const prova = new URLSearchParams(location.hash.slice(1));
  if (prova.has("battaglia") || prova.has("blocco")) {
    g.nome = g.nome || "Prova";
    g.punti = Number(prova.get("punti") || 8);
    g.munizioni = Number(prova.get("munizioni") || 4);
    $("btn-istruzioni").classList.remove("nascosto");
    if (prova.has("battaglia")) battaglia(limita(Number(prova.get("battaglia")) - 1, 0, 3));
    else blocco(limita(Number(prova.get("blocco")) - 1, 0, 3));
  } else if (prova.has("report")) {
    g.nome = g.nome || "Prova";
    g.vinteQuali = (prova.get("report") || "1010").split("").map((c) => c === "1");
    report();
  } else if (prova.has("finale")) {
    g.nome = g.nome || "Prova";
    g.punti = Number(prova.get("punti") || 12);
    finale();
  } else {
    titolo();
  }
})();
