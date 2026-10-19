// Cenário de fundo da tela título: um pátio de colunas à noite, com a câmera
// passeando devagar e os três símbolos brilhando no escuro.
import * as A from "../arte/objetos.js";
import { desenharSimbolo } from "../arte/simbolos.js";
import { px, paleta, Mapa, objeto, braseiro, ambiente, desenharNevoa } from "./comum.js";

function mapa() {
  const m = new Mapa(34, 15, ".");
  m.ret("P", 0, 1, 34, 2);
  m.ret("l", 9, 5, 16, 6);
  m.ret("w", 10, 6, 14, 4);
  m.ret("M", 0, 0, 34, 1).ret("M", 0, 0, 1, 15).ret("M", 33, 0, 1, 15).ret("M", 0, 14, 34, 1);
  return m.linhas();
}

const def = {
  larg: 34,
  alt: 15,
  mapa: mapa(),
  legenda: { M: "muro", P: "parede", ".": "pedra", l: "ladrilho", w: "agua" },
  paleta: paleta({
    ladrilho: "#7e7c78",
    ladrilho2: "#6c6a68",
    ladrilhoRejunte: "#36343e",
    pedra: "#8a8680",
    pedra2: "#77736c",
    rejunte: "#45414a",
    celula: 13,
    musgo: "#56664a",
    agua: "#22506c",
    aguaFunda: "#0c2032",
    argamassa: "#3a3640",
    bloco: "#77716a",
    bloco2: "#68625c",
    topo: "#8a847c",
    topo2: "#7a746e",
  }),
  aguas: [{ x: 10, y: 6, w: 14, h: 4, cores: { claro: "rgba(160,206,240,0.5)", medio: "rgba(96,146,196,0.32)" } }],
  decalques: [
    { tipo: "poca", x: 6, y: 11, w: 1.4, h: 0.5 },
    { tipo: "rachadura", x: 26, y: 12, n: 14 },
  ],
  inicio: { x: 17, y: 12, dir: "cima" },
  escuridao: 0.8,
  musica: "titulo",
};

let simbolos = [];

function montar(jogo, m) {
  // O jogador fica escondido: aqui é só cenário.
  jogo.jogador.visivel = false;
  jogo.jogador.travado = true;
  for (const [x, y] of [[4, 4.6], [30, 4.6], [8, 12.6], [26, 12.6]]) braseiro(m, px(x), px(y));
  for (const [x, y, q] of [[6.5, 5.2, false], [27.5, 5.2, false], [13, 12.8, true], [21, 12.8, false]]) {
    objeto(m, A.coluna(q), px(x), px(y), { solido: { w: 16, h: 7 } });
  }
  m.luzes.push({ x: px(17), y: px(8), raio: 160, cor: [70, 130, 210], brilho: 0.14, intensidade: 0.35 });
  simbolos = ["talha", "gota", "maca"].map((id, i) => ({ img: desenharSimbolo(id), x: px(12 + i * 5), y: px(3.6), fase: i * 2.1 }));
}

function atualizar(jogo, dt) {
  // A câmera passeia devagar de um lado para o outro.
  jogo.focar(px(17) + Math.sin(jogo.t * 0.11) * px(6), px(7.4));
  ambiente(jogo, dt, {
    vagalumes: [{ x: px(1), y: px(3), w: px(32), h: px(11), taxa: 1.6 }],
    brilhosAgua: [{ x: px(10), y: px(6), w: px(14), h: px(4), taxa: 2 }],
  });
}

function desenharPorCima(ctx, cx, cy, jogo) {
  desenharNevoa(ctx, cx, cy, { x: px(6), y: px(4.4), w: px(22), h: px(7.6) }, jogo.t, 0.1, 4);
  // Os três símbolos pulsando na muralha, como se a luz negra passasse por eles.
  ctx.globalCompositeOperation = "lighter";
  for (const s of simbolos) {
    const a = Math.max(0, Math.sin(jogo.t * 0.9 + s.fase)) ** 2;
    if (a < 0.02) continue;
    ctx.globalAlpha = a * 0.9;
    ctx.drawImage(s.img, Math.round(s.x - cx - s.img.width / 2), Math.round(s.y - cy - s.img.height / 2 + Math.sin(jogo.t + s.fase)));
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export const titulo = { def, montar, atualizar, desenharPorCima };
