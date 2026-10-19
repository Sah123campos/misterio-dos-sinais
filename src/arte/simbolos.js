// Símbolos misteriosos e letras pixeladas das inscrições (luz negra).
import { Pixmap, rgb, criarCanvas } from "./pixel.js";

export const SIMBOLOS = {
  talha: {
    nome: "Talha",
    mascara: [
      ".............",
      "...#######...",
      "..#.......#..",
      "...#######...",
      "...#.....#...",
      "..#.......#..",
      ".#..#...#..#.",
      ".#.........#.",
      ".#..#...#..#.",
      ".#.........#.",
      "..#.......#..",
      "...#######...",
      ".............",
    ],
  },
  gota: {
    nome: "Gota",
    mascara: [
      "......#......",
      "......#......",
      ".....#.#.....",
      ".....#.#.....",
      "....#...#....",
      "...#.....#...",
      "..#.......#..",
      "..#..#....#..",
      "..#...#...#..",
      "..#.......#..",
      "...#.....#...",
      "....#####....",
      ".............",
    ],
  },
  maca: {
    nome: "Maca",
    mascara: [
      ".............",
      ".............",
      "#...........#",
      ".###########.",
      ".#.#.#.#.#.#.",
      ".###########.",
      ".#.#.#.#.#.#.",
      ".###########.",
      "#...........#",
      ".............",
      "....#...#....",
      "...#.....#...",
      ".............",
    ],
  },
  estrela: {
    nome: "Estrela",
    mascara: [
      "......#......",
      ".....#.#.....",
      ".....#.#.....",
      "#####...#####",
      ".#.........#.",
      "..#.......#..",
      "...#.....#...",
      "..#...#...#..",
      "..#..#.#..#..",
      ".#..#...#..#.",
      ".#.#.....#.#.",
      ".##.......##.",
      ".............",
    ],
  },
  peixe: {
    nome: "Peixe",
    mascara: [
      ".............",
      ".............",
      ".......#.....",
      "...####.#....",
      "..#......#..#",
      ".#..#.....##.",
      ".#.........#.",
      ".#........##.",
      "..#......#..#",
      "...####.#....",
      ".......#.....",
      ".............",
      ".............",
    ],
  },
  chave: {
    nome: "Chave",
    mascara: [
      ".............",
      ".............",
      ".............",
      ".###.........",
      "#...#........",
      "#...#########",
      "#...#....#.#.",
      ".###.....#.#.",
      ".............",
      ".............",
      ".............",
      ".............",
      ".............",
    ],
  },
};

// Desenha um símbolo com halo (brilho) em volta.
export function desenharSimbolo(id, cor = "#e6d4ff", halo = "#8a4aff", margem = 2) {
  const m = SIMBOLOS[id].mascara;
  const w = m[0].length + margem * 2;
  const h = m.length + margem * 2;
  const pm = new Pixmap(w, h);
  const c = rgb(cor);
  if (halo) {
    const hc = rgb(halo);
    const meio = [hc[0], hc[1], hc[2], 130];
    const fraco = [hc[0], hc[1], hc[2], 60];
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (m[y][x] !== "#") continue;
        for (let oy = -2; oy <= 2; oy++) {
          for (let ox = -2; ox <= 2; ox++) {
            const d = Math.abs(ox) + Math.abs(oy);
            if (d === 0 || d > 2) continue;
            const px = x + margem + ox;
            const py = y + margem + oy;
            if (pm.get(px, py)) continue;
            pm.set(px, py, d === 1 ? meio : fraco);
          }
        }
      }
    }
  }
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) if (m[y][x] === "#") pm.set(x + margem, y + margem, c);
  }
  return pm.paraCanvas();
}

// Símbolo "apagado" (ainda não descoberto) para a interface.
export function simboloApagado(id) {
  return desenharSimbolo(id, "#4a3e66", null, 2);
}

// ---------- Fonte 3x5 com acentos ----------
const LETRAS = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["..#", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "###", "#.#", "#.#"],
  N: ["##.", "#.#", "#.#", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "##.", ".##"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "###", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["##.", "..#", ".#.", "#..", "###"],
  3: ["##.", "..#", ".#.", "..#", "##."],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "##.", "..#", "##."],
  6: [".##", "#..", "###", "#.#", "###"],
  7: ["###", "..#", ".#.", ".#.", ".#."],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "##."],
  "?": ["##.", "..#", ".#.", "...", ".#."],
  "!": [".#.", ".#.", ".#.", "...", ".#."],
  ".": ["...", "...", "...", "...", ".#."],
  ",": ["...", "...", "...", ".#.", "#.."],
  ":": ["...", ".#.", "...", ".#.", "..."],
  "-": ["...", "...", "###", "...", "..."],
  "·": ["...", "...", ".#.", "...", "..."],
  ">": ["#..", ".#.", "..#", ".#.", "#.."],
  "<": ["..#", ".#.", "#..", ".#.", "..#"],
  "+": ["...", ".#.", "###", ".#.", "..."],
  "'": [".#.", ".#.", "...", "...", "..."],
  " ": ["...", "...", "...", "...", "..."],
};

const ACENTOS = {
  "Á": ["A", [[2, -1], [1, -2]]],
  "À": ["A", [[0, -2], [1, -1]]],
  "Â": ["A", [[0, -1], [1, -2], [2, -1]]],
  "Ã": ["A", [[0, -1], [1, -2], [2, -2]]],
  "É": ["E", [[2, -1], [1, -2]]],
  "Ê": ["E", [[0, -1], [1, -2], [2, -1]]],
  "Í": ["I", [[2, -1], [1, -2]]],
  "Ó": ["O", [[2, -1], [1, -2]]],
  "Ô": ["O", [[0, -1], [1, -2], [2, -1]]],
  "Õ": ["O", [[0, -1], [1, -2], [2, -2]]],
  "Ú": ["U", [[2, -1], [1, -2]]],
  "Ç": ["C", [[1, 5]]],
};

// Renderiza um texto em pixels. Linhas separadas por "\n".
export function textoPixel(texto, opcoes = {}) {
  const cor = rgb(opcoes.cor || "#e6d4ff");
  const halo = opcoes.halo === null ? null : rgb(opcoes.halo || "#8a4aff");
  const linhas = texto.toUpperCase().split("\n");
  const largura = Math.max(...linhas.map((l) => l.length)) * 4 - 1;
  const ALT_LINHA = 9;
  const m = 2;
  const pm = new Pixmap(largura + m * 2, linhas.length * ALT_LINHA - 1 + m * 2);
  const pontos = [];
  linhas.forEach((linha, li) => {
    const x0 = Math.floor((largura - (linha.length * 4 - 1)) / 2);
    [...linha].forEach((ch, ci) => {
      let base = ch;
      let extras = [];
      if (ACENTOS[ch]) [base, extras] = ACENTOS[ch];
      const g = LETRAS[base] || LETRAS["?"];
      const ox = m + x0 + ci * 4;
      const oy = m + li * ALT_LINHA + 2;
      g.forEach((row, y) => [...row].forEach((c, x) => c === "#" && pontos.push([ox + x, oy + y])));
      for (const [x, y] of extras) pontos.push([ox + x, oy + y]);
    });
  });
  if (halo) {
    for (const [x, y] of pontos) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pm.set(x + dx, y + dy, [halo[0], halo[1], halo[2], 110]);
    }
  }
  for (const [x, y] of pontos) pm.set(x, y, cor);
  return pm.paraCanvas();
}

// Seta pixelada apontando no ângulo dado (radianos).
export function setaPixel(angulo, comp = 14, cor = "#e6d4ff", halo = "#8a4aff") {
  const tam = comp + 8;
  const pm = new Pixmap(tam, tam);
  const c = rgb(cor);
  const hc = rgb(halo);
  const cx = tam / 2;
  const cy = tam / 2;
  const dx = Math.cos(angulo);
  const dy = Math.sin(angulo);
  const pts = [];
  for (let i = -comp / 2; i <= comp / 2; i += 0.5) pts.push([cx + dx * i, cy + dy * i]);
  const px = cx + (dx * comp) / 2;
  const py = cy + (dy * comp) / 2;
  for (const s of [-1, 1]) {
    const a = angulo + Math.PI + s * 0.7;
    for (let i = 0; i <= 4; i += 0.5) pts.push([px + Math.cos(a) * i, py + Math.sin(a) * i]);
  }
  for (const [x, y] of pts) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) pm.set(Math.round(x + ox), Math.round(y + oy), [hc[0], hc[1], hc[2], 100]);
  for (const [x, y] of pts) pm.set(Math.round(x), Math.round(y), c);
  return pm.paraCanvas();
}

// Ícone pequeno para a interface (canvas sem halo, cor dourada/violeta).
export function iconeSimbolo(id, conhecido = true) {
  return conhecido ? desenharSimbolo(id, "#efe0ff", "#9a5aff", 2) : simboloApagado(id);
}

export { criarCanvas };
