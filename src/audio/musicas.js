// Trilha sonora original, composta em código.
// Cada música tem uma camada "base" e uma camada de "tensão" que o jogo
// aumenta nos momentos de suspense (escuro, luz negra, enigmas).
// Grade: 16 passos por compasso (semicolcheias).

const ruido = (i, s = 0) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Converte "D4 . Eb4 . . ." em mapa passo → nota.
function melodia(compassos) {
  const mapa = {};
  compassos.forEach((linha, c) => {
    linha
      .trim()
      .split(/\s+/)
      .forEach((tok, i) => {
        if (tok !== ".") mapa[c * 16 + i] = tok;
      });
  });
  return mapa;
}

// Duração (em passos) até a próxima nota, para notas longas da flauta.
function duracoes(mapa, total) {
  const passos = Object.keys(mapa).map(Number).sort((a, b) => a - b);
  const d = {};
  passos.forEach((p, i) => (d[p] = (passos[i + 1] ?? total) - p));
  return d;
}

// ---------- Tela inicial: misteriosa ----------
const neyTitulo = melodia([
  "A4 . . . . . . . Bb4 . . . A4 . . .",
  "G4 . . . . . F#4 . G4 . . . . . . .",
  "A4 . . . . . . . . . . . . . . .",
  "D5 . . . . . C5 . Bb4 . . . A4 . . .",
  "G4 . . . . . . . Bb4 . . . A4 . . .",
  "F#4 . . . . . . . Eb4 . . . D4 . . .",
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
]);
const durTitulo = duracoes(neyTitulo, 96);

const titulo = {
  bpm: 58,
  passos: 128,
  volume: 0.9,
  passo(m, s, i, t) {
    const seg = 60 / this.bpm / 4;
    if (i % 64 === 0) m.pad(["D2", "A2", "D3"], t, seg * 64, s.base, { vol: 0.05, brilho: 620 });
    if (i === 32 || i === 96) m.pad(["Eb3", "G3", "Bb3"], t, seg * 24, s.base, { vol: 0.025, brilho: 900 });
    if (neyTitulo[i]) m.flauta(neyTitulo[i], t, Math.min(durTitulo[i], 12) * seg, s.base, { vol: 0.085 });
    if (i % 32 === 0) m.sino(i % 64 === 0 ? "D5" : "A4", t, s.base, { vol: 0.05, dur: 3.5 });
    if (i % 8 === 4) m.corda(["D3", "A3", "D4", "F#4"][(i / 8) % 4 | 0], t, s.base, { vol: 0.12, brilho: 1400, dur: 1.6 });
    if (i % 16 === 0) m.doum(t, s.tensao, 0.16);
  },
};

// ---------- Caná: festa de casamento ----------
const oudCana = melodia([
  "D4 . Eb4 . F#4 . G4 . A4 . . . G4 . F#4 .",
  "G4 . A4 . Bb4 . A4 . G4 . F#4 . Eb4 . D4 .",
  "A4 . . . Bb4 . A4 . G4 . A4 . F#4 . . .",
  "G4 . F#4 . Eb4 . F#4 . D4 . . . . . . .",
  "D5 . C5 . Bb4 . A4 . Bb4 . C5 . D5 . . .",
  "C5 . Bb4 . A4 . G4 . A4 . . . Bb4 . A4 .",
  "G4 . F#4 . G4 . A4 . Bb4 . A4 . G4 . F#4 .",
  "Eb4 . . . D4 . . . . . . . . . . .",
]);
const neyCana = melodia([
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
  "A4 . . . . . . . . . . . G4 . . .",
  "F#4 . . . . . . . G4 . . . . . . .",
  "A4 . . . . . . . . . . . Bb4 . . .",
  "A4 . . . . . . . . . . . . . . .",
]);
const durNeyCana = duracoes(neyCana, 128);
const baixoCana = ["D2", "D2", "G2", "D2", "Bb1", "C2", "G2", "D2"];

const cana = {
  bpm: 100,
  passos: 128,
  volume: 0.85,
  passo(m, s, i, t) {
    const seg = 60 / this.bpm / 4;
    const c = Math.floor(i / 16);
    const p = i % 16;
    // Ritmo maqsum na darbuka.
    if (p === 0 || p === 8) m.doum(t, s.base, 0.22);
    if (p === 2 || p === 6 || p === 12) m.tek(t, s.base, 0.07);
    if (p === 4 || p === 10 || p === 14) m.riq(t, s.base, 0.03);
    // Baixo
    if (p === 0) m.baixo(baixoCana[c], t, seg * 7, s.base, { vol: 0.13 });
    if (p === 8) m.baixo(c % 2 ? "A1" : "A2", t, seg * 6, s.base, { vol: 0.1 });
    // Alaúde (oud) com a melodia
    if (oudCana[i]) m.corda(oudCana[i], t, s.base, { vol: 0.24, brilho: 3000, dur: 1.2 });
    if (p % 4 === 0 && !oudCana[i]) m.corda(p % 8 ? "A3" : "D3", t, s.base, { vol: 0.08, brilho: 1600, dur: 0.8 });
    if (neyCana[i]) m.flauta(neyCana[i], t, Math.min(12, durNeyCana[i]) * seg, s.base, { vol: 0.06 });
    // Tensão: noite caindo, algo estranho.
    if (i % 32 === 0) m.pad(["D2", "Eb3", "A3"], t, seg * 30, s.tensao, { vol: 0.04, brilho: 700 });
    if (i % 32 === 20) m.sino("A5", t, s.tensao, { vol: 0.025, dur: 3 });
    // Ambiente: conversas e estalos de tocha.
    if (ruido(i, 1) < 0.1) m.ruidoFiltrado(t, 0.35 + ruido(i, 2) * 0.4, m.busAmb, { f: 500 + ruido(i, 3) * 500, q: 3, vol: 0.022, ataque: 0.06 });
    if (ruido(i, 4) < 0.18) m.ruidoFiltrado(t, 0.02, m.busAmb, { tipo: "highpass", f: 3000, vol: 0.03 });
  },
};

// ---------- Poço de Jacó: contemplativa, meio-dia ----------
const acordesPoco = [
  ["A2", "E3", "A3", "C4"],
  ["A2", "E3", "A3", "C4"],
  ["D3", "F#3", "A3", "D4"],
  ["D3", "F#3", "A3", "D4"],
  ["G2", "D3", "G3", "B3"],
  ["G2", "D3", "G3", "B3"],
  ["F2", "C3", "F3", "A3"],
  ["E2", "B2", "E3", "G#3"],
];
const neyPoco = melodia([
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
  "F#4 . . . . . . . A4 . . . . . . .",
  "D5 . . . . . . . C5 . . . B4 . . .",
  ". . . . . . . . . . . . . . . .",
  "B4 . . . . . . . A4 . . . G4 . . .",
  "A4 . . . . . . . . . . . . . . .",
  "G#4 . . . . . . . . . . . . . . .",
]);
const durNeyPoco = duracoes(neyPoco, 128);

const poco = {
  bpm: 76,
  passos: 128,
  volume: 0.9,
  passo(m, s, i, t) {
    const seg = 60 / this.bpm / 4;
    const c = Math.floor(i / 16);
    const p = i % 16;
    const ac = acordesPoco[c];
    if (p === 0 && (c % 2 === 0 || c >= 6)) m.pad(ac, t, seg * (c >= 6 ? 15 : 31), s.base, { vol: 0.04, brilho: 1300, onda: "triangle" });
    if (p % 2 === 0) {
      const nota = ac[(p / 2) % 4];
      const oitava = nota.replace(/(\d)$/, (d) => String(Number(d) + 1));
      m.corda(oitava, t, s.base, { vol: 0.13, brilho: 4200, dur: 1.8 });
    }
    if (p === 0) m.baixo(ac[0], t, seg * 14, s.base, { vol: 0.09 });
    if (neyPoco[i]) m.flauta(neyPoco[i], t, Math.min(10, durNeyPoco[i]) * seg, s.base, { vol: 0.07 });
    if (p === 4 || p === 12) m.riq(t, s.base, 0.018);
    // Tensão (gruta escura)
    if (p % 4 === 0) m.baixo("A1", t, seg * 2, s.tensao, { vol: 0.12 });
    if (i % 32 === 0) m.pad(["E3", "A3", "B3"], t, seg * 30, s.tensao, { vol: 0.035, brilho: 800 });
    // Ambiente: pássaros e vento
    if (ruido(i, 5) < 0.045) {
      const f0 = 2200 + ruido(i, 6) * 1800;
      m.tom(f0, t, 0.07, m.busAmb, { vol: 0.02, f2: f0 * 1.3 });
      m.tom(f0 * 1.1, t + 0.09, 0.06, m.busAmb, { vol: 0.016, f2: f0 * 0.9 });
    }
    if (i % 64 === 0) m.ruidoFiltrado(t, 7, m.busAmb, { tipo: "lowpass", f: 380, vol: 0.05, ataque: 2.5 });
  },
};

// ---------- Betesda: noite misteriosa ----------
const escalaBetesda = ["E5", "F5", "G5", "B5", "A5", "C6", "E6", "B4"];
const acordesBetesda = [
  ["E3", "G3", "B3"],
  ["E3", "G3", "B3"],
  ["F3", "A3", "C4"],
  ["F3", "A3", "C4"],
  ["E3", "G3", "B3"],
  ["E3", "G3", "B3"],
  ["D3", "F3", "A3"],
  ["E3", "G#3", "B3"],
];

const betesda = {
  bpm: 64,
  passos: 128,
  volume: 0.95,
  passo(m, s, i, t) {
    const seg = 60 / this.bpm / 4;
    const c = Math.floor(i / 16);
    const p = i % 16;
    if (i === 0) m.pad(["E2", "B2"], t, seg * 126, s.base, { vol: 0.045, brilho: 520 });
    if (p === 0 && c % 2 === 0) m.pad(acordesBetesda[c], t, seg * 30, s.base, { vol: 0.03, brilho: 900, onda: "triangle" });
    if (p === 0 && c >= 6) m.pad(acordesBetesda[c], t, seg * 14, s.base, { vol: 0.03, brilho: 900, onda: "triangle" });
    // Gotas de corda com eco
    if ([0, 6, 11].includes(p) && ruido(i, 7) < 0.8) {
      m.corda(escalaBetesda[Math.floor(ruido(i, 8) * escalaBetesda.length)], t, s.base, { vol: 0.09, brilho: 3800, dur: 1.5, eco: true });
    }
    if (i === 8 || i === 72) m.sino("B4", t, s.base, { vol: 0.045, dur: 4 });
    // Tensão: batida de coração e trítono
    if (p === 0) {
      m.doum(t, s.tensao, 0.2);
      m.doum(t + seg * 1.5, s.tensao, 0.14);
    }
    if (i % 32 === 0) m.pad(["F3", "B3"], t, seg * 30, s.tensao, { vol: 0.03, brilho: 1000 });
    // Ambiente: grilos e goteiras
    if (ruido(i, 9) < 0.16) {
      for (let k = 0; k < 3; k++) m.tom(4600 + ruido(i, 10) * 600, t + k * 0.045, 0.025, m.busAmb, { vol: 0.008 });
    }
    if (ruido(i, 11) < 0.05) m.tom(1900, t, 0.09, m.busAmb, { vol: 0.03, f2: 900 });
  },
};

// ---------- Revelação final ----------
const acordesRev = [
  ["D3", "F#3", "A3", "D4"],
  ["D3", "F#3", "A3", "D4"],
  ["B2", "D3", "F#3", "B3"],
  ["B2", "D3", "F#3", "B3"],
  ["G2", "D3", "G3", "B3"],
  ["G2", "D3", "G3", "B3"],
  ["A2", "E3", "A3", "C#4"],
  ["A2", "E3", "A3", "C#4"],
];
const neyRev = melodia([
  "F#5 . . . . . . . . . . . E5 . . .",
  "D5 . . . . . . . . . . . . . . .",
  "D5 . . . . . . . C#5 . . . B4 . . .",
  "A4 . . . . . . . . . . . . . . .",
  "B4 . . . . . . . D5 . . . . . . .",
  "G5 . . . . . . . F#5 . . . . . . .",
  "E5 . . . . . . . . . . . A4 . . .",
  "C#5 . . . . . . . . . . . . . . .",
]);
const durRev = duracoes(neyRev, 128);

const revelacao = {
  bpm: 66,
  passos: 128,
  volume: 1,
  passo(m, s, i, t) {
    const seg = 60 / this.bpm / 4;
    const c = Math.floor(i / 16);
    const p = i % 16;
    const ac = acordesRev[c];
    if (p === 0 && c % 2 === 0) m.pad(ac, t, seg * 31, s.base, { vol: 0.055, brilho: 1500 + c * 120 });
    if (p % 4 === 0) {
      const n = ac[(p / 4) % 4].replace(/(\d)$/, (d) => String(Number(d) + 2));
      m.sino(n, t, s.base, { vol: 0.03, dur: 2.4 });
    }
    if (p === 0) {
      m.doum(t, s.base, 0.2);
      m.baixo(ac[0].replace(/(\d)$/, (d) => String(Number(d) - 1)), t, seg * 15, s.base, { vol: 0.12 });
    }
    if (neyRev[i]) m.flauta(neyRev[i], t, Math.min(12, durRev[i]) * seg, s.base, { vol: 0.075 });
  },
};

export const MUSICAS = { titulo, cana, poco, betesda, revelacao };
