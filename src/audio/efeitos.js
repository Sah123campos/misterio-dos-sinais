// Efeitos sonoros sintetizados. Cada efeito recebe (motor, tempo, opções).
// Para trocar por arquivos gravados, basta substituir a função por uma que
// toque um AudioBuffer carregado.

const aleat = (a, b) => a + Math.random() * (b - a);

export const EFEITOS = {
  // Passos em superfícies diferentes.
  passo(m, t, { terreno = "pedra" }) {
    const d = m.busSfx;
    if (terreno === "pedra") {
      m.ruidoFiltrado(t, 0.045, d, { f: aleat(1400, 2200), q: 2.5, vol: 0.06 });
      m.tom(aleat(130, 170), t, 0.04, d, { vol: 0.04, onda: "triangle" });
    } else if (terreno === "terra") {
      m.ruidoFiltrado(t, 0.07, d, { tipo: "lowpass", f: aleat(700, 1000), vol: 0.07 });
    } else if (terreno === "grama") {
      m.ruidoFiltrado(t, 0.09, d, { tipo: "highpass", f: aleat(2500, 3600), vol: 0.035, ataque: 0.02 });
      m.ruidoFiltrado(t, 0.05, d, { tipo: "lowpass", f: 600, vol: 0.03 });
    } else if (terreno === "madeira") {
      m.tom(aleat(170, 210), t, 0.07, d, { vol: 0.07, onda: "triangle" });
      m.ruidoFiltrado(t, 0.03, d, { f: 900, q: 2, vol: 0.04 });
    } else if (terreno === "molhado") {
      m.ruidoFiltrado(t, 0.08, d, { f: aleat(900, 1300), q: 1.2, vol: 0.06 });
      m.tom(aleat(900, 1300), t + 0.02, 0.05, d, { vol: 0.02, f2: 500 });
    }
  },

  lanterna(m, t) {
    m.tom(1800, t, 0.015, m.busSfx, { onda: "square", vol: 0.04 });
    m.tom(900, t + 0.03, 0.02, m.busSfx, { onda: "square", vol: 0.03 });
  },

  lanternaDesliga(m, t) {
    m.tom(900, t, 0.015, m.busSfx, { onda: "square", vol: 0.035 });
    m.tom(600, t + 0.025, 0.02, m.busSfx, { onda: "square", vol: 0.025 });
  },

  uv(m, t) {
    EFEITOS.lanterna(m, t);
    m.tom(110, t + 0.02, 0.5, m.busSfx, { onda: "sawtooth", vol: 0.03, f2: 220 });
    m.ruidoFiltrado(t + 0.02, 0.6, m.busSfx, { f: 600, f2: 3200, q: 6, vol: 0.03, ataque: 0.1 });
  },

  // Descoberta de pista: brilho + sinos.
  revelar(m, t) {
    m.ruidoFiltrado(t, 0.9, m.busSfx, { f: 400, f2: 6000, q: 3, vol: 0.05, ataque: 0.5 });
    ["E5", "B5", "E6"].forEach((n, i) => m.sino(n, t + 0.45 + i * 0.12, m.busSfx, { vol: 0.06, dur: 2.2 }));
  },

  simbolo(m, t) {
    ["D5", "F#5", "A5", "D6"].forEach((n, i) => m.sino(n, t + i * 0.1, m.busSfx, { vol: 0.07, dur: 2.6 }));
    m.pad(["D3", "A3", "F#4"], t, 1.4, m.busSfx, { vol: 0.05, brilho: 1800, ataque: 0.3 });
  },

  acerto(m, t) {
    ["G4", "B4", "D5", "G5"].forEach((n, i) => m.corda(n, t + i * 0.07, m.busSfx, { vol: 0.3, brilho: 4000, dur: 1.4 }));
  },

  erro(m, t) {
    m.tom(130, t, 0.25, m.busSfx, { onda: "triangle", vol: 0.12, f2: 90 });
    m.tom(138, t, 0.25, m.busSfx, { onda: "triangle", vol: 0.08, f2: 95 });
  },

  clique(m, t) {
    m.tom(1200, t, 0.02, m.busSfx, { onda: "square", vol: 0.03 });
  },

  encaixe(m, t) {
    m.ruidoFiltrado(t, 0.05, m.busSfx, { f: 1800, q: 4, vol: 0.08 });
    m.tom(320, t, 0.08, m.busSfx, { onda: "triangle", vol: 0.08, f2: 240 });
  },

  avancar(m, t) {
    m.tom(660, t, 0.03, m.busSfx, { onda: "triangle", vol: 0.025 });
  },

  pagina(m, t) {
    m.ruidoFiltrado(t, 0.18, m.busSfx, { f: 2600, f2: 1200, q: 0.8, vol: 0.05, ataque: 0.04 });
  },

  // Água sendo despejada (enchendo uma talha).
  encher(m, t, { dur = 1.2 } = {}) {
    m.ruidoFiltrado(t, dur, m.busSfx, { f: 700, f2: 1500, q: 1.4, vol: 0.09, ataque: 0.08 });
    m.ruidoFiltrado(t, dur, m.busSfx, { tipo: "lowpass", f: 400, vol: 0.06, ataque: 0.1 });
    for (let k = 0; k < 9; k++) {
      const tt = t + 0.1 + k * (dur / 10);
      const f0 = 500 + k * 70 + Math.random() * 200;
      m.tom(f0, tt, 0.05, m.busSfx, { vol: 0.025, f2: f0 * 1.6 });
    }
  },

  agua(m, t) {
    m.ruidoFiltrado(t, 0.5, m.busSfx, { f: 900, q: 1, vol: 0.05, ataque: 0.05 });
    m.tom(700, t + 0.05, 0.08, m.busSfx, { vol: 0.03, f2: 1100 });
  },

  balde(m, t) {
    m.tom(240, t, 0.12, m.busSfx, { onda: "triangle", vol: 0.08, f2: 200 });
    m.ruidoFiltrado(t + 0.08, 0.35, m.busSfx, { f: 900, q: 1, vol: 0.05 });
  },

  // A água se transforma em vinho: brilho que cresce e sinos.
  transformacao(m, t) {
    m.ruidoFiltrado(t, 2.6, m.busSfx, { f: 200, f2: 5000, q: 4, vol: 0.06, ataque: 2 });
    m.pad(["D3", "A3", "D4", "F#4"], t, 3, m.busSfx, { vol: 0.07, brilho: 2200, ataque: 1.8 });
    ["A5", "D6", "F#6", "A6", "D7"].forEach((n, i) => m.sino(n, t + 1.6 + i * 0.14, m.busSfx, { vol: 0.05, dur: 3 }));
  },

  cura(m, t) {
    m.pad(["E3", "B3", "E4", "G#4"], t, 3, m.busSfx, { vol: 0.07, brilho: 2400, ataque: 1.4 });
    ["E5", "G#5", "B5", "E6"].forEach((n, i) => m.sino(n, t + 1.1 + i * 0.16, m.busSfx, { vol: 0.05, dur: 3 }));
  },

  porta(m, t) {
    m.tom(70, t, 0.9, m.busSfx, { onda: "sawtooth", vol: 0.04, f2: 110 });
    m.ruidoFiltrado(t, 0.9, m.busSfx, { f: 500, f2: 900, q: 8, vol: 0.05, ataque: 0.2 });
    m.tom(90, t + 0.9, 0.2, m.busSfx, { onda: "triangle", vol: 0.12, f2: 60 });
  },

  fechadura(m, t) {
    [0, 0.08, 0.2].forEach((d, i) => m.tom(1500 - i * 300, t + d, 0.02, m.busSfx, { onda: "square", vol: 0.04 }));
    m.tom(180, t + 0.3, 0.12, m.busSfx, { onda: "triangle", vol: 0.1, f2: 120 });
  },

  mecanismo(m, t) {
    for (let k = 0; k < 6; k++) m.ruidoFiltrado(t + k * 0.11, 0.04, m.busSfx, { f: 1400 + k * 80, q: 5, vol: 0.06 });
    m.ruidoFiltrado(t + 0.6, 1.6, m.busSfx, { tipo: "lowpass", f: 300, vol: 0.14, ataque: 0.3 });
    m.tom(55, t + 2.1, 0.4, m.busSfx, { onda: "sine", vol: 0.2, f2: 40 });
  },

  pedra(m, t) {
    m.ruidoFiltrado(t, 1.8, m.busSfx, { tipo: "lowpass", f: 260, vol: 0.16, ataque: 0.2 });
    m.ruidoFiltrado(t, 1.8, m.busSfx, { f: 900, q: 3, vol: 0.03, ataque: 0.3 });
    m.tom(48, t + 1.8, 0.5, m.busSfx, { vol: 0.22, f2: 36 });
  },

  coluna(m, t, { ordem = 0 } = {}) {
    const notas = ["D5", "F#5", "A5", "D6"];
    m.sino(notas[ordem % notas.length], t, m.busSfx, { vol: 0.08, dur: 2.5 });
    m.ruidoFiltrado(t, 0.08, m.busSfx, { f: 1600, q: 3, vol: 0.05 });
  },

  passagem(m, t) {
    m.ruidoFiltrado(t, 1.2, m.busSfx, { f: 300, f2: 2400, q: 1, vol: 0.06, ataque: 0.4 });
  },

  susto(m, t) {
    m.pad(["D3", "Eb3", "A3"], t, 1.6, m.busSfx, { vol: 0.06, brilho: 900, ataque: 0.05 });
    m.tom(55, t, 1, m.busSfx, { vol: 0.15, f2: 45 });
  },

  final(m, t) {
    m.tom(40, t, 3, m.busSfx, { vol: 0.25, f2: 30, ataque: 0.5 });
    m.ruidoFiltrado(t, 3, m.busSfx, { f: 120, f2: 60, q: 1, vol: 0.12, ataque: 1 });
    ["D4", "A4", "D5", "F#5", "A5"].forEach((n, i) => m.sino(n, t + 1 + i * 0.25, m.busSfx, { vol: 0.06, dur: 4 }));
  },
};

// Timbre dos "bips" de fala de cada personagem.
export const VOZES = {
  padrao: { f: 300, onda: "triangle", vol: 0.04 },
  jogador: { f: 330, onda: "triangle" },
  debora: { f: 470, onda: "triangle", vol: 0.035 },
  kenedy: { f: 250, onda: "triangle" },
  bea: { f: 520, onda: "triangle", vol: 0.035 },
  mj: { f: 230, onda: "triangle" },
  samuel: { f: 270, onda: "triangle" },
  thama: { f: 410, onda: "triangle", vol: 0.035 },
  jesus: { f: 196, onda: "sine", vol: 0.06 },
  maria: { f: 392, onda: "sine", vol: 0.05 },
  servo: { f: 230, onda: "triangle" },
  servo2: { f: 210, onda: "triangle" },
  mestre: { f: 180, onda: "triangle" },
  noivo: { f: 240, onda: "triangle" },
  samaritana: { f: 370, onda: "sine", vol: 0.05 },
  enfermo: { f: 170, onda: "triangle" },
  enfermoCurado: { f: 200, onda: "triangle" },
  narrador: { f: 260, onda: "sine", vol: 0.03 },
};
