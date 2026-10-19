// Peças compartilhadas pelos roteiros das salas: mapas, objetos, personagens,
// luzes, marcas da luz negra, partículas de ambiente e névoa.
import { Sprite, Personagem } from "../motor/entidades.js";
import { folhaDe } from "../ui/retratos.js";
import { ELENCO } from "../dados/elenco.js";
import { TILE } from "../config.js";
import { rgb, criarCanvas, Pixmap, bayer } from "../arte/pixel.js";
import * as A from "../arte/objetos.js";
import { gerarFolha, gerarDeitado } from "../arte/personagens.js";
import { desenharSimbolo, textoPixel } from "../arte/simbolos.js";

// Tiles → pixels de arte.
export const px = (t) => Math.round(t * TILE);

// Converte as cores da paleta (texto "#rrggbb") para [r, g, b, a].
export function paleta(p) {
  const r = {};
  for (const [k, v] of Object.entries(p)) r[k] = typeof v === "string" ? rgb(v) : v;
  return r;
}

// Mapa montado por retângulos e elipses (mais fácil de ajustar que desenhar
// cada linha à mão). Cada caractere é traduzido pela "legenda" da sala.
export class Mapa {
  constructor(larg, alt, fundo) {
    this.larg = larg;
    this.alt = alt;
    this.g = Array.from({ length: alt }, () => Array(larg).fill(fundo));
  }

  ret(ch, x, y, w, h) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (j >= 0 && j < this.alt && i >= 0 && i < this.larg) this.g[j][i] = ch;
      }
    }
    return this;
  }

  elipse(ch, cx, cy, rx, ry) {
    for (let j = 0; j < this.alt; j++) {
      for (let i = 0; i < this.larg; i++) {
        const dx = (i + 0.5 - cx) / rx;
        const dy = (j + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.g[j][i] = ch;
      }
    }
    return this;
  }

  linhas() {
    return this.g.map((l) => l.join(""));
  }
}

// ---------- Entidades ----------
export function objeto(mundo, arte, x, y, o = {}) {
  return mundo.adicionar(new Sprite({ img: arte.img, quadros: arte.quadros, ax: arte.ax, ay: arte.ay, x, y, ...o }));
}

// Personagem do elenco. "visual" permite reaproveitar a aparência de outro.
export function npc(mundo, id, x, y, o = {}) {
  const p = ELENCO[id];
  return mundo.adicionar(new Personagem({ id, nome: p.nome, folha: folhaDe(o.visual ?? id), brilho: !!p.brilho, x, y, ...o }));
}

const cacheDeitado = new Map();
export function imagemDeitado(id) {
  if (!cacheDeitado.has(id)) cacheDeitado.set(id, gerarDeitado(ELENCO[id].sprite));
  return cacheDeitado.get(id);
}

// Personagem deitado numa maca (doentes de Betesda).
export function deitado(mundo, id, x, y, o = {}) {
  return objeto(mundo, { img: imagemDeitado(id), ax: 14, ay: 11 }, x, y, { solido: { w: 24, h: 6 }, ...o });
}

// Interação padrão para conversar com alguém.
export function conversa(rotulo, acao, extra = {}) {
  return { rotulo, acao, icone: "falar", raio: 22, ...extra };
}

export function exame(rotulo, acao, extra = {}) {
  return { rotulo, acao, icone: "examinar", raio: 20, ...extra };
}

// Diálogo em que cada personagem gesticula na sua vez de falar.
export async function falarComGestos(jogo, falas, atores = {}) {
  for (const f of falas) {
    atores[f.quem]?.gesticular(1.4);
    await jogo.falar([f]);
  }
}

// ---------- Luzes ----------
export function tocha(mundo, x, y, o = {}) {
  const s = objeto(mundo, A.tocha(), x, y, { fps: 9, solido: { w: 6, h: 4 }, sombra: { rx: 4, ry: 1 } });
  const luz = { x, y: y - 24, raio: o.raio ?? 96, cor: [255, 150, 60], brilho: 0.32, tremor: 1, fagulhas: true };
  mundo.luzes.push(luz);
  s.luz = luz;
  return s;
}

export function braseiro(mundo, x, y, o = {}) {
  const s = objeto(mundo, A.braseiro(), x, y, { fps: 9, solido: { w: 12, h: 5 }, sombra: { rx: 7, ry: 2 } });
  const luz = { x, y: y - 14, raio: o.raio ?? 112, cor: [255, 140, 60], brilho: 0.34, tremor: 1.2, fagulhas: true };
  mundo.luzes.push(luz);
  s.luz = luz;
  return s;
}

// Lamparina sobre uma mesa: "elevar" sobe a imagem até o tampo.
export function lamparina(mundo, x, y, elevar = 0) {
  const arte = A.lamparina();
  objeto(mundo, arte, x, y, { ay: arte.ay + elevar, fps: 7, profundidade: 1 });
  mundo.luzes.push({ x, y: y - elevar - 6, raio: 46, cor: [255, 170, 80], brilho: 0.22, tremor: 0.8 });
}

// ---------- Luz negra ----------
// Marca escondida, só visível dentro do feixe da luz negra.
// aoRevelar é chamado quando o jogador a ilumina por um instante.
export function marca(mundo, img, x, y, o = {}) {
  const ins = {
    img,
    x: Math.round(x),
    y: Math.round(y),
    luz: o.luz ?? "uv",
    ativa: o.ativa ?? null,
    aoRevelar: o.aoRevelar ?? null,
    revelada: false,
    tempo: 0,
  };
  mundo.uv.push(ins);
  return ins;
}

// Amplia uma imagem pequena sem borrar (para inscrições maiores).
export function ampliar(img, k) {
  const c = criarCanvas(img.width * k, img.height * k);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

// A chave numerada: a marca que se repete nas três salas.
export function imagemChave(numero) {
  const s = desenharSimbolo("chave");
  const n = textoPixel(String(numero));
  const c = criarCanvas(s.width + n.width, Math.max(s.height, n.height));
  const ctx = c.getContext("2d");
  ctx.drawImage(s, 0, 0);
  ctx.drawImage(n, s.width - 2, Math.round((s.height - n.height) / 2) + 1);
  return c;
}

// ---------- Jogador ----------
const folhasJogador = new Map();
// Troca a folha do jogador (ex.: carregando um cântaro).
export function jogadorCom(jogo, acessorio) {
  if (!acessorio) {
    jogo.jogador.folha = folhaDe("jogador");
    return;
  }
  if (!folhasJogador.has(acessorio)) {
    const base = ELENCO.jogador.sprite;
    folhasJogador.set(acessorio, gerarFolha({ ...base, acessorios: [...base.acessorios.filter((a) => a !== "lanterna"), acessorio] }));
  }
  jogo.jogador.folha = folhasJogador.get(acessorio);
}

// ---------- Animação ----------
// Chama fn(k) com k indo de 0 a 1 durante "dur" segundos.
export function animar(dur, fn) {
  return new Promise((ok) => {
    const t0 = performance.now();
    const passo = (agora) => {
      const k = Math.min(1, (agora - t0) / (dur * 1000));
      fn(k);
      if (k < 1) requestAnimationFrame(passo);
      else ok();
    };
    requestAnimationFrame(passo);
  });
}

export const suave = (k) => k * k * (3 - 2 * k);

// ---------- Partículas de ambiente ----------
export function ambiente(jogo, dt, cfg) {
  const P = jogo.particulas;
  const chance = (taxa) => Math.random() < taxa * dt;
  const sorteio = (z) => ({ x: z.x + Math.random() * z.w, y: z.y + Math.random() * z.h });
  for (const z of cfg.vagalumes || []) {
    if (!chance(z.taxa ?? 1.2)) continue;
    const p = sorteio(z);
    P.emitir({ ...p, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, vida: 3 + Math.random() * 3, cor: "#efff9a", cor2: "#9ad04a", emissiva: true, tipo: "vagalume" });
  }
  for (const z of cfg.folhas || []) {
    if (!chance(z.taxa ?? 0.4)) continue;
    const p = sorteio(z);
    P.emitir({ ...p, vx: 3 + Math.random() * 5, vy: 7 + Math.random() * 6, vida: 2.5 + Math.random() * 2, cor: Math.random() < 0.5 ? "#7a9440" : "#a8944a", tipo: "folha" });
  }
  for (const z of cfg.brilhosAgua || []) {
    if (!chance(z.taxa ?? 2)) continue;
    const p = sorteio(z);
    P.emitir({ ...p, vida: 0.5 + Math.random() * 0.6, cor: "#d8f0ff", emissiva: true, tipo: "brilho" });
  }
  for (const z of cfg.petalas || []) {
    if (!chance(z.taxa ?? 0.3)) continue;
    const p = sorteio(z);
    P.emitir({ ...p, vx: 4 + Math.random() * 4, vy: 5 + Math.random() * 4, vida: 3 + Math.random() * 2, cor: Math.random() < 0.5 ? "#f0a0b8" : "#f6eadc", tipo: "folha" });
  }
  if (cfg.sol && chance(cfg.sol)) {
    const { w, h } = jogo.tela;
    P.emitir({ x: jogo.camera.x + Math.random() * w, y: jogo.camera.y + Math.random() * h, vx: 2 + Math.random() * 3, vy: -1 - Math.random() * 2, vida: 3 + Math.random() * 2, cor: "#fff2c8" });
  }
  // Poeira flutuando dentro do feixe da lanterna.
  const j = jogo.jogador;
  const feixe = typeof cfg.poeiraFeixe === "function" ? cfg.poeiraFeixe(jogo) : cfg.poeiraFeixe;
  if (feixe && j && jogo.lanterna !== "desligada" && chance(8)) {
    const d = 16 + Math.random() * 84;
    const a = j.angulo + (Math.random() - 0.5) * 0.75;
    P.emitir({
      x: j.x + Math.cos(a) * d,
      y: j.y - 10 + Math.sin(a) * d,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 3,
      vida: 1 + Math.random(),
      cor: jogo.lanterna === "uv" ? "#c8a0ff" : "#fff0c8",
      emissiva: true,
    });
  }
}

// Brilhos dourados subindo (sinais, revelações).
export function brilhos(jogo, x, y, n = 24, cor = "#ffe9a8", espalhar = 14) {
  for (let i = 0; i < n; i++) {
    jogo.particulas.emitir({
      x: x + (Math.random() - 0.5) * espalhar,
      y: y + (Math.random() - 0.5) * espalhar * 0.6,
      vx: (Math.random() - 0.5) * 10,
      vy: -10 - Math.random() * 18,
      vida: 0.8 + Math.random() * 1,
      cor,
      emissiva: true,
      tipo: "brilho",
    });
  }
}

// ---------- Névoa ----------
let imgNevoa = null;
function criarNevoa() {
  // Ondas periódicas (a imagem se repete sem emenda) com pontilhado.
  const W = 256;
  const H = 128;
  const pm = new Pixmap(W, H);
  const TAU = Math.PI * 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const v = y / H;
      let n = Math.sin(TAU * (u * 2 + 0.35 * Math.sin(TAU * v))) * 0.5 + Math.sin(TAU * (v * 2 + u)) * 0.3 + Math.sin(TAU * (u * 3 - v)) * 0.2;
      n = (n + 1) / 2;
      if (n > bayer(x, y) * 0.8 + 0.35) pm.set(x, y, [206, 220, 240, 255]);
    }
  }
  return pm.paraCanvas();
}

// Névoa pixelada passando devagar dentro de uma elipse.
export function desenharNevoa(ctx, cx, cy, area, t, alfa = 0.1, vel = 5) {
  if (!imgNevoa) imgNevoa = criarNevoa();
  const img = imgNevoa;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(area.x + area.w / 2 - cx, area.y + area.h / 2 - cy, area.w / 2, area.h / 2, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = alfa;
  for (const [sentido, fase, dy] of [[1, 0, 0], [-1, 77, 37]]) {
    const ox = Math.round(((t * vel * sentido + fase) % img.width) + img.width) % img.width;
    const x0 = area.x - cx - ox;
    const y0 = area.y - cy - dy;
    for (let y = y0; y < area.y - cy + area.h; y += img.height) {
      for (let x = x0; x < area.x - cx + area.w; x += img.width) ctx.drawImage(img, Math.round(x), Math.round(y));
    }
  }
  ctx.restore();
}
