// Pintor procedural do chão e das paredes de cada sala.
// Gera, uma única vez por sala, uma imagem grande com todo o cenário fixo:
// pedras irregulares, terra, grama, madeira, paredes em perspectiva 3/4,
// sombras de contato e decalques (tapetes, folhas, poças).
import { criarCanvas, hash, ruido, fbm, rgb, misturar, clarear, escurecer } from "./pixel.js";
import { TILE } from "../config.js";

// Tipos de terreno (o caractere usado nos mapas fica na legenda de cada sala).
export const SOLIDOS = new Set(["muro", "parede", "rocha", "rochaTopo", "reboco", "agua", "vazio"]);
const PAREDES = new Set(["parede", "reboco", "rocha"]);
const TOPOS = new Set(["muro", "rochaTopo"]);

// ---------- Utilidades ----------
function corV(base, v) {
  // v em [-1, 1]: escurece ou clareia levemente
  return v >= 0 ? misturar(base, [255, 246, 220], v * 0.5) : misturar(base, [30, 18, 50], -v * 0.6);
}

function voronoi(x, y, celula, s) {
  const cx = Math.floor(x / celula);
  const cy = Math.floor(y / celula);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  let sx = 0;
  let sy = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const gx = cx + i;
      const gy = cy + j;
      const px = (gx + 0.15 + hash(gx, gy, s) * 0.7) * celula;
      const py = (gy + 0.15 + hash(gy, gx, s + 9) * 0.7) * celula;
      const dx = x - px;
      const dy = y - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = gx * 7919 + gy * 104729;
        sx = dx;
        sy = dy;
      } else if (d < d2) d2 = d;
    }
  }
  return { borda: d2 - d1, id, dx: sx, dy: sy, d1 };
}

// ---------- Pintores de chão (retornam [r,g,b]) ----------
const PINTORES = {
  pedra(x, y, P) {
    // Lajes irregulares de pedra (Voronoi), com rejunte e bisel iluminado.
    const v = voronoi(x, y, P.celula || 12, 3);
    if (v.borda < 1.25) return corV(P.rejunte, (ruido(x, y, 3, 5) - 0.5) * 0.4);
    const h = hash(v.id, 1, 2);
    let c = misturar(P.pedra, P.pedra2, h);
    c = corV(c, (fbm(x, y, 10, 4, 2) - 0.5) * 0.35);
    if (v.borda < 3.2) {
      const len = Math.max(0.001, Math.hypot(v.dx, v.dy));
      const luz = (-v.dx / len) * 0.55 + (-v.dy / len) * 0.8; // luz vinda de cima-esquerda
      c = corV(c, luz > 0.35 ? 0.28 : luz < -0.35 ? -0.32 : 0);
    }
    const r = hash(x, y, 77);
    if (r > 0.985) c = corV(c, -0.35);
    else if (r < 0.012) c = corV(c, 0.3);
    if (P.musgo && fbm(x, y, 20, 13, 2) > 0.66 && v.borda < 2.5) c = misturar(c, P.musgo, 0.6);
    return c;
  },
  lajota(x, y, P) {
    // Lajotas retangulares (interiores).
    const alt = 8;
    const linha = Math.floor(y / alt);
    const desloc = linha % 2 ? 6 : 0;
    const larg = 12;
    const col = Math.floor((x + desloc) / larg);
    const lx = (x + desloc) % larg;
    const ly = y % alt;
    if (lx === 0 || ly === 0) return corV(P.rejunte, -0.1);
    let c = misturar(P.pedra, P.pedra2, hash(col, linha, 5));
    c = corV(c, (ruido(x, y, 4, 2) - 0.5) * 0.25);
    if (ly === 1 || lx === 1) c = corV(c, 0.18);
    if (ly === alt - 1 || lx === larg - 1) c = corV(c, -0.2);
    return c;
  },
  terra(x, y, P) {
    let c = misturar(P.terra, P.terra2, fbm(x, y, 22, 21, 3));
    const n = ruido(x, y, 2.5, 8);
    c = corV(c, (n - 0.5) * 0.28);
    const r = hash(x, y, 31);
    if (r > 0.992) c = clarear(P.pedrinha || P.terra2, 0.25);
    else if (r > 0.984) c = escurecer(P.terra, 0.25);
    // Pedrinhas com sombra
    const p = hash(Math.floor(x / 5), Math.floor(y / 5), 41);
    if (p > 0.93 && x % 5 === 2 && y % 5 === 2) c = P.pedrinha || clarear(P.terra2, 0.3);
    if (p > 0.93 && x % 5 === 2 && y % 5 === 3) c = escurecer(P.terra, 0.3);
    return c;
  },
  ladrilho(x, y, P) {
    // Ladrilhos quadrados, com rejunte e bisel (pisos internos e molhados).
    const t = P.ladrilhoTam || 8;
    const lx = x % t;
    const ly = y % t;
    if (lx === 0 || ly === 0) return corV(P.ladrilhoRejunte || P.rejunte, (ruido(x, y, 3, 7) - 0.5) * 0.3);
    let c = misturar(P.ladrilho || P.pedra, P.ladrilho2 || P.pedra2, hash(Math.floor(x / t), Math.floor(y / t), 13));
    c = corV(c, (ruido(x, y, 3, 17) - 0.5) * 0.22);
    if (lx === 1 || ly === 1) c = corV(c, 0.16);
    if (lx === t - 1 || ly === t - 1) c = corV(c, -0.18);
    if (P.musgo && fbm(x, y, 12, 19, 2) > 0.7 && (lx < 2 || ly < 2)) c = misturar(c, P.musgo, 0.5);
    if (hash(x, y, 23) > 0.985) c = corV(c, -0.3);
    return c;
  },
  areia(x, y, P) {
    let c = misturar(P.areia, P.areia2, fbm(x, y, 18, 51, 3));
    // Ondulações de vento
    const onda = Math.sin((x * 0.35 + y * 0.9 + ruido(x, y, 12, 3) * 6) * 0.9);
    if (onda > 0.92) c = corV(c, 0.15);
    else if (onda < -0.95) c = corV(c, -0.12);
    return corV(c, (hash(x, y, 9) - 0.5) * 0.16);
  },
  grama(x, y, P) {
    let c = misturar(P.grama, P.grama2, fbm(x, y, 16, 61, 3));
    const fio = hash(x, Math.floor(y / 3), 63);
    if (fio > 0.86) c = corV(c, 0.22);
    else if (fio < 0.1) c = corV(c, -0.25);
    const flor = hash(Math.floor(x / 7), Math.floor(y / 7), 67);
    if (P.flores && flor > 0.965 && x % 7 === 3 && y % 7 === 3) c = rgb(P.flores[Math.floor(flor * 1000) % P.flores.length]);
    return c;
  },
  madeira(x, y, P) {
    const alt = 6;
    const tabua = Math.floor(y / alt);
    const ly = y % alt;
    const off = hash(tabua, 0, 3) * 40;
    const seg = Math.floor((x + off) / 40);
    const lx = (x + off) % 40;
    if (ly === 0) return escurecer(P.madeira, 0.45);
    if (lx < 1) return escurecer(P.madeira, 0.35);
    let c = misturar(P.madeira, P.madeira2, hash(tabua, seg, 7));
    const veio = Math.sin(x * 0.7 + ruido(x, y, 9, tabua) * 9);
    if (veio > 0.85) c = corV(c, -0.18);
    if (ly === 1) c = corV(c, 0.15);
    return c;
  },
  agua(x, y, P) {
    // Base escura (o brilho animado é desenhado por cima, a cada quadro).
    const prof = P.profundidade?.(x, y) ?? 0.5;
    return misturar(P.agua, P.aguaFunda, prof);
  },
  vazio() {
    return [8, 6, 14];
  },
};

// Paredes vistas de frente (face vertical em perspectiva 3/4).
const PAREDES_PINTORES = {
  parede(x, y, P, yRel, altFace) {
    // Blocos de pedra assentados.
    const curso = 6;
    const linha = Math.floor(yRel / curso);
    const ly = yRel % curso;
    const desloc = (linha % 2) * 8 + hash(linha, 0, 4) * 4;
    const larg = 14 + Math.floor(hash(linha, 1, 5) * 4);
    const col = Math.floor((x + desloc) / larg);
    const lx = Math.floor(x + desloc) % larg;
    let c;
    if (ly === curso - 1 || lx === 0) c = P.argamassa;
    else {
      c = misturar(P.bloco, P.bloco2, hash(col, linha, 6));
      c = corV(c, (ruido(x, y, 3, 9) - 0.5) * 0.3);
      if (ly === 0) c = corV(c, 0.22);
      if (ly === curso - 2) c = corV(c, -0.15);
      if (lx === 1) c = corV(c, 0.1);
    }
    if (P.musgo && fbm(x, y, 14, 17, 2) > 0.68 && yRel > altFace * 0.5) c = misturar(c, P.musgo, 0.55);
    return sombraBase(c, yRel, altFace);
  },
  reboco(x, y, P, yRel, altFace) {
    // Parede rebocada com manchas e alguns tijolos aparentes.
    let c = misturar(P.reboco, P.reboco2, fbm(x, y, 18, 71, 3));
    c = corV(c, (ruido(x, y, 2, 73) - 0.5) * 0.12);
    const exposto = fbm(x, y, 16, 79, 2);
    if (exposto > 0.7) {
      const ly = yRel % 5;
      const lx = (x + (Math.floor(yRel / 5) % 2) * 5) % 10;
      c = ly === 4 || lx === 0 ? escurecer(P.tijolo, 0.35) : corV(P.tijolo, (hash(Math.floor(x / 10), Math.floor(yRel / 5), 3) - 0.5) * 0.3);
    } else if (exposto > 0.66) c = escurecer(c, 0.18);
    // Rachaduras finas
    const rach = Math.abs(ruido(x, y, 9, 83) - 0.5);
    if (rach < 0.012) c = escurecer(c, 0.3);
    if (yRel === 0) c = corV(c, 0.25);
    return sombraBase(c, yRel, altFace);
  },
  rocha(x, y, P, yRel, altFace) {
    // Paredão de rocha natural.
    const n = fbm(x, y * 1.6, 14, 91, 3);
    let c = misturar(P.rocha, P.rocha2, n);
    const faixa = Math.sin(y * 0.55 + ruido(x, y, 18, 93) * 7);
    if (faixa > 0.8) c = corV(c, 0.2);
    else if (faixa < -0.85) c = corV(c, -0.3);
    const v = voronoi(x, y * 1.4, 10, 97);
    if (v.borda < 1) c = corV(c, -0.4);
    else if (v.borda < 2 && v.dy < 0) c = corV(c, 0.18);
    return sombraBase(c, yRel, altFace);
  },
};

function sombraBase(c, yRel, altFace) {
  const dist = altFace - 1 - yRel;
  if (dist < 3) return corV(c, -0.12 * (3 - dist));
  return c;
}

// ---------- Montagem do cenário ----------
export function pintarCenario(sala) {
  const L = sala.larg * TILE;
  const A = sala.alt * TILE;
  const canvas = criarCanvas(L, A);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(L, A);
  const d = img.data;
  const P = sala.paleta;
  const grade = sala.grade; // array de nomes de terreno por tile

  const tipoEm = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= sala.larg || ty >= sala.alt) return "vazio";
    return grade[ty * sala.larg + tx];
  };

  // Para cada coluna, mede onde começa cada face de parede (para os blocos).
  for (let y = 0; y < A; y++) {
    for (let x = 0; x < L; x++) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      const base = tipoEm(tx, ty);
      let tipo = base;
      // Bordas orgânicas entre terrenos de chão (não mexe em paredes).
      if (!PAREDES.has(base) && !TOPOS.has(base)) {
        const jx = Math.round((ruido(x, y, 5, 11) - 0.5) * 7);
        const jy = Math.round((ruido(x, y, 5, 13) - 0.5) * 7);
        const t2 = tipoEm(Math.floor((x + jx) / TILE), Math.floor((y + jy) / TILE));
        if (!PAREDES.has(t2) && !TOPOS.has(t2) && t2 !== "vazio" && t2 !== "agua" && base !== "agua") tipo = t2;
      }
      let c;
      if (PAREDES.has(tipo)) {
        // Altura da face: conta os tiles de parede contínuos nesta coluna.
        let topo = ty;
        while (PAREDES.has(tipoEm(tx, topo - 1))) topo--;
        let fim = ty;
        while (PAREDES.has(tipoEm(tx, fim + 1))) fim++;
        const yRel = y - topo * TILE;
        const altFace = (fim - topo + 1) * TILE;
        c = PAREDES_PINTORES[tipo](x, y, P, yRel, altFace);
      } else if (TOPOS.has(tipo)) {
        c = pintarTopo(x, y, tx, ty, tipo, P, tipoEm);
      } else {
        const f = PINTORES[tipo] || PINTORES.vazio;
        c = f(x, y, P);
        c = sombrasDeContato(c, x, y, tx, ty, tipoEm, tipo);
      }
      const i = (y * L + x) * 4;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  for (const dec of sala.decalques || []) desenharDecalque(ctx, dec, P);
  return canvas;
}

function pintarTopo(x, y, tx, ty, tipo, P, tipoEm) {
  const lx = x % TILE;
  const ly = y % TILE;
  let c = tipo === "rochaTopo" ? misturar(P.rochaTopo || P.topo, P.rocha2 || P.topo2, fbm(x, y, 9, 101, 2)) : misturar(P.topo, P.topo2, fbm(x, y, 12, 103, 2));
  c = corV(c, (hash(x, y, 107) - 0.5) * 0.18);
  const abaixo = tipoEm(tx, ty + 1);
  const acima = tipoEm(tx, ty - 1);
  const esq = tipoEm(tx - 1, ty);
  const dir = tipoEm(tx + 1, ty);
  const parede = (t) => PAREDES.has(t) || TOPOS.has(t) || t === "vazio";
  // Borda iluminada onde o topo encontra a face da parede.
  if (PAREDES.has(abaixo) && ly >= TILE - 2) c = ly === TILE - 1 ? clarear(c, 0.35) : clarear(c, 0.15);
  if (!parede(abaixo) && ly >= TILE - 1) c = escurecer(c, 0.45);
  if (!parede(acima) && ly === 0) c = clarear(c, 0.2);
  if (!parede(esq) && lx === 0) c = escurecer(c, 0.3);
  if (!parede(dir) && lx === TILE - 1) c = escurecer(c, 0.35);
  return c;
}

function sombrasDeContato(c, x, y, tx, ty, tipoEm, tipo) {
  const ly = y % TILE;
  const lx = x % TILE;
  // Sombra projetada pela parede logo acima.
  const acima = tipoEm(tx, ty - 1);
  if (PAREDES.has(acima) || TOPOS.has(acima)) {
    if (ly < 5) c = misturar(c, [20, 12, 36], (5 - ly) * 0.09);
  }
  // Leve sombra nas laterais junto a paredes.
  const esq = tipoEm(tx - 1, ty);
  const dir = tipoEm(tx + 1, ty);
  if ((PAREDES.has(esq) || TOPOS.has(esq)) && lx < 3) c = misturar(c, [20, 12, 36], (3 - lx) * 0.07);
  if ((PAREDES.has(dir) || TOPOS.has(dir)) && lx > TILE - 3) c = misturar(c, [20, 12, 36], (lx - (TILE - 3)) * 0.05);
  // Borda da água: pedras do parapeito.
  if (tipo !== "agua") {
    for (const [ox, oy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      if (tipoEm(tx + ox, ty + oy) === "agua") {
        const dist = ox === 1 ? TILE - 1 - lx : ox === -1 ? lx : oy === 1 ? TILE - 1 - ly : ly;
        if (dist < 3) c = dist === 0 ? escurecer(c, 0.35) : dist === 1 ? clarear(c, 0.25) : c;
      }
    }
  }
  return c;
}

// ---------- Decalques ----------
function desenharDecalque(ctx, dec, P) {
  const x = Math.round(dec.x * TILE);
  const y = Math.round(dec.y * TILE);
  const w = Math.round((dec.w || 1) * TILE);
  const h = Math.round((dec.h || 1) * TILE);
  if (dec.tipo === "tapete") {
    const c1 = dec.cor || "#8a2a2a";
    const c2 = dec.cor2 || "#d8a848";
    const c3 = dec.cor3 || "#3a2a5a";
    ctx.fillStyle = "rgba(10,6,20,0.35)";
    ctx.fillRect(x + 1, y + 2, w, h);
    ctx.fillStyle = c1;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = c2;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
    ctx.fillRect(x + 2, y + 2, 1, h - 4);
    ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
    ctx.fillStyle = c3;
    for (let i = 6; i < w - 6; i += 6) {
      for (let j = 6; j < h - 6; j += 6) {
        ctx.fillRect(x + i, y + j, 2, 2);
        ctx.fillRect(x + i + 1, y + j - 1, 1, 1);
        ctx.fillRect(x + i + 1, y + j + 2, 1, 1);
      }
    }
    // Franjas
    ctx.fillStyle = c2;
    for (let i = 1; i < w; i += 2) {
      ctx.fillRect(x + i, y - 1, 1, 1);
      ctx.fillRect(x + i, y + h, 1, 1);
    }
  } else if (dec.tipo === "folhas" || dec.tipo === "palha" || dec.tipo === "petalas") {
    const n = dec.n || 30;
    const cores = dec.tipo === "folhas" ? ["#6a7a2a", "#8a6a2a", "#5a4a1e"] : dec.tipo === "palha" ? ["#c8a860", "#a88a48", "#e0c878"] : ["#e86a8a", "#f0e0e8", "#e8b040"];
    for (let i = 0; i < n; i++) {
      const px = x + Math.floor(hash(i, dec.x * 10, 3) * w);
      const py = y + Math.floor(hash(dec.y * 10, i, 5) * h);
      ctx.fillStyle = cores[i % cores.length];
      ctx.fillRect(px, py, dec.tipo === "palha" ? 3 : 2, 1);
    }
  } else if (dec.tipo === "poca") {
    ctx.fillStyle = "rgba(60,90,120,0.45)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(200,220,255,0.35)";
    ctx.fillRect(x + w / 2 - 3, y + h / 2 - 1, 4, 1);
  } else if (dec.tipo === "sombra") {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 1, x + w / 2, y + h / 2, Math.max(w, h) / 2);
    g.addColorStop(0, `rgba(16,10,30,${dec.forca ?? 0.45})`);
    g.addColorStop(1, "rgba(16,10,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (dec.tipo === "rachadura") {
    ctx.fillStyle = "rgba(20,12,30,0.55)";
    let cx = x;
    let cy = y;
    for (let i = 0; i < (dec.n || 14); i++) {
      ctx.fillRect(cx, cy, 1, 1);
      cx += hash(i, cx, 1) > 0.5 ? 1 : 0;
      cy += hash(cy, i, 2) > 0.35 ? 1 : 0;
    }
  } else if (dec.tipo === "degraus") {
    for (let i = 0; i < h; i++) {
      const t = i % 4;
      ctx.fillStyle = t === 0 ? "rgba(255,240,210,0.18)" : t === 3 ? "rgba(20,12,36,0.35)" : "rgba(0,0,0,0)";
      ctx.fillRect(x, y + i, w, 1);
    }
  }
}
