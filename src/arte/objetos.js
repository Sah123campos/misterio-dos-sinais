// Objetos do cenário em pixel art, desenhados por código.
// Cada função devolve { img, ax, ay }: a imagem e o ponto (ax, ay) que fica
// apoiado no chão (a "base" usada para ordenar a profundidade).
import { Pixmap, rgb, misturar, escurecer, clarear, hash, ruido, fbm, criarCanvas } from "./pixel.js";

const cache = new Map();
function memo(chave, fn) {
  if (!cache.has(chave)) cache.set(chave, fn());
  return cache.get(chave);
}

// Sombreamento de cilindro: nx em [-1, 1] (luz vindo da esquerda).
function cilindro(base, nx, forte = 1) {
  if (nx < -0.62) return clarear(base, 0.22 * forte);
  if (nx < -0.2) return clarear(base, 0.08 * forte);
  if (nx > 0.78) return escurecer(base, 0.42 * forte);
  if (nx > 0.4) return escurecer(base, 0.22 * forte);
  return base;
}

function saida(pm, ax, ay, contorno = true) {
  if (contorno) pm.contorno(0.62);
  return { img: pm.paraCanvas(), ax, ay };
}

// ---------------- Caná ----------------

// Talha de pedra (João 2:6). O conteúdo é desenhado à parte (ver conteudoTalha).
export function talha() {
  return memo("talha", () => {
    const pm = new Pixmap(18, 25);
    const pedra = rgb("#b7ad96");
    const cx = 9;
    for (let y = 5; y <= 22; y++) {
      let hw = 7;
      if (y > 18) hw = 7 - (y - 18) * 0.6;
      if (y < 8) hw = 6.5 + (y - 5) * 0.17;
      for (let x = 0; x < 18; x++) {
        const nx = (x + 0.5 - cx) / hw;
        if (Math.abs(nx) > 1) continue;
        let c = cilindro(pedra, nx);
        // marcas de cinzel e textura
        if ((y + Math.floor(hash(x, 0, 3) * 2)) % 5 === 0) c = escurecer(c, 0.1);
        const r = hash(x, y, 11);
        if (r > 0.9) c = escurecer(c, 0.12);
        else if (r < 0.06) c = clarear(c, 0.12);
        pm.set(x, y, c);
      }
    }
    // faixa entalhada
    for (let x = 2; x <= 15; x++) pm.set(x, 9, escurecer(cilindro(pedra, (x + 0.5 - cx) / 7), 0.18));
    // alças (pegas laterais)
    pm.rect(0, 9, 2, 2, escurecer(pedra, 0.15));
    pm.rect(16, 9, 2, 2, escurecer(pedra, 0.35));
    // borda da boca
    pm.elipse(cx, 5, 7.2, 2.7, (x, y, nx, ny) => (ny < -0.2 ? clarear(pedra, 0.3) : clarear(pedra, 0.1)));
    // interior escuro
    pm.elipse(cx, 5.2, 5.2, 1.8, (x, y, nx, ny) => (ny < 0 ? rgb("#2a2430") : rgb("#3a3240")));
    return saida(pm, 9, 23);
  });
}

// Desenha o conteúdo da talha (água ou vinho) por cima da boca.
// nivel 0..1, cor: "agua" | "vinho" | mistura em transicao (0..1)
export function conteudoTalha(ctx, x, y, nivel, transicao = 0, t = 0) {
  if (nivel <= 0) return;
  const agua = rgb("#4f9ccc");
  const vinho = rgb("#7a1636");
  const base = misturar(agua, vinho, transicao);
  const claro = clarear(base, 0.35);
  const ox = Math.round(x - 9);
  const oy = Math.round(y - 23);
  // A superfície sobe dentro da boca conforme o nível.
  const sobe = Math.round((1 - nivel) * 1);
  ctx.fillStyle = `rgb(${escurecer(base, 0.25).slice(0, 3)})`;
  ctx.fillRect(ox + 5, oy + 4 + sobe, 8, 2);
  ctx.fillRect(ox + 4, oy + 5 + sobe, 10, 1);
  ctx.fillStyle = `rgb(${base.slice(0, 3)})`;
  ctx.fillRect(ox + 6, oy + 4 + sobe, 6, 1);
  ctx.fillRect(ox + 5, oy + 5 + sobe, 7, 1);
  // brilho que se move
  const bx = Math.round(5 + ((t * 3) % 6));
  ctx.fillStyle = `rgb(${claro.slice(0, 3)})`;
  ctx.fillRect(ox + bx, oy + 4 + sobe, 2, 1);
}

// Mesa de banquete com toalha e comida.
export function mesa(variante = 0) {
  return memo("mesa" + variante, () => {
    const W = 50;
    const H = 26;
    const pm = new Pixmap(W, H);
    const toalha = rgb(variante % 2 ? "#e8dcc2" : "#efe6d2");
    const faixa = rgb(variante % 2 ? "#3e5f96" : "#9a3a2e");
    // tampo (visto de cima)
    for (let y = 4; y <= 15; y++) {
      for (let x = 1; x < W - 1; x++) {
        let c = toalha;
        if (y === 4) c = clarear(toalha, 0.2);
        if (x === 1) c = clarear(toalha, 0.1);
        if (x >= W - 3) c = escurecer(toalha, 0.12);
        pm.set(x, y, c);
      }
    }
    // frente da toalha caindo, com dobras e faixa colorida
    for (let y = 16; y <= 22; y++) {
      for (let x = 1; x < W - 1; x++) {
        let c = escurecer(toalha, 0.12);
        if ((x + 2) % 7 === 0) c = escurecer(toalha, 0.26);
        if ((x + 1) % 7 === 0) c = escurecer(toalha, 0.04);
        if (y === 19 || y === 20) c = (x + y) % 7 === 0 ? escurecer(faixa, 0.3) : faixa;
        if (y === 22) c = escurecer(toalha, 0.32);
        pm.set(x, y, c);
      }
    }
    // comida
    const s = variante * 17;
    const pao = (x, y) => {
      pm.elipse(x, y, 3.4, 2, (px, py, nx, ny) => (ny < -0.3 ? rgb("#e7b46a") : nx > 0.4 ? rgb("#9a5a26") : rgb("#c98a42")));
      pm.set(x - 1, y - 1, rgb("#f4d090"));
      pm.set(x + 1, y, rgb("#8a4a1c"));
    };
    const uvas = (x, y) => {
      const roxo = rgb("#5a2a6a");
      for (const [dx, dy] of [[0, 0], [2, 0], [1, 1], [3, 1], [-1, 1], [0, 2], [2, 2], [1, 3]]) {
        pm.set(x + dx, y + dy, (dx + dy) % 2 ? roxo : clarear(roxo, 0.2));
      }
      pm.set(x + 1, y - 1, rgb("#4a7a2a"));
      pm.set(x + 2, y - 1, rgb("#6a9a3a"));
    };
    const copo = (x, y) => {
      pm.rect(x, y, 3, 3, rgb("#a86b48"));
      pm.set(x, y, rgb("#5a1a2a"));
      pm.set(x + 1, y, rgb("#7a2236"));
      pm.set(x + 2, y + 2, rgb("#7a4a30"));
    };
    const tigela = (x, y, cor) => {
      pm.elipse(x, y, 4, 2.2, rgb("#b9784a"));
      pm.elipse(x, y - 0.4, 3, 1.3, rgb(cor));
      pm.set(x - 1, y - 1, clarear(rgb(cor), 0.3));
    };
    const figos = (x, y) => {
      for (const [dx, dy] of [[0, 0], [2, 1], [-1, 2]]) {
        pm.set(x + dx, y + dy, rgb("#6a3a5a"));
        pm.set(x + dx + 1, y + dy, rgb("#8a4a6a"));
      }
    };
    const lugares = [
      () => pao(7 + (s % 3), 9),
      () => uvas(14, 7),
      () => copo(21, 7),
      () => tigela(28, 10, "#6a8a3a"),
      () => figos(35, 7),
      () => pao(41, 10),
      () => copo(44, 6),
      () => uvas(5, 12),
      () => copo(17, 12),
      () => tigela(37, 12, "#d8c060"),
    ];
    lugares.forEach((f, i) => {
      if (hash(i, variante, 3) > 0.15) f();
    });
    return saida(pm, 25, 22);
  });
}

// Tocha de chão: 4 quadros de fogo.
export function tocha() {
  return memo("tocha", () => {
    const quadros = [];
    for (let q = 0; q < 4; q++) {
      const pm = new Pixmap(12, 32);
      const madeira = rgb("#6a4428");
      for (let y = 12; y <= 30; y++) {
        pm.set(5, y, clarear(madeira, 0.12));
        pm.set(6, y, escurecer(madeira, 0.2));
      }
      pm.rect(4, 29, 4, 2, escurecer(madeira, 0.25));
      // cesto de ferro
      const ferro = rgb("#4a4048");
      pm.rect(3, 10, 6, 3, ferro);
      pm.rect(2, 9, 8, 1, clarear(ferro, 0.2));
      pm.set(4, 11, rgb("#ff9a3a"));
      pm.set(7, 11, rgb("#e0602a"));
      chama(pm, 6, 9, 3.4, 8, q);
      quadros.push(pm.contorno(0.55).paraCanvas());
    }
    return { quadros, ax: 6, ay: 30 };
  });
}

// Desenha uma chama com camadas de cor (fora laranja, meio amarelo, centro claro).
export function chama(pm, cx, base, larg, alt, q) {
  const cores = [rgb("#d8401e"), rgb("#ff8a2a"), rgb("#ffd25a"), rgb("#fff4c8")];
  for (let camada = 0; camada < 4; camada++) {
    const esc = 1 - camada * 0.24;
    for (let i = 0; i <= alt * esc; i++) {
      const y = base - i;
      const t = i / (alt * esc);
      const balanco = Math.sin(q * 1.6 + i * 0.7) * (0.6 + t * 1.1);
      const hw = larg * esc * Math.sin(Math.PI * (0.18 + t * 0.82)) * (1 - t * 0.55);
      for (let x = Math.floor(cx - hw + balanco); x <= Math.ceil(cx + hw + balanco - 1); x++) pm.set(x, y, cores[camada]);
    }
  }
  // fagulha
  pm.set(cx + ((q * 3) % 5) - 2, base - alt - 2 - (q % 2), cores[2]);
}

export function lamparina() {
  return memo("lamparina", () => {
    const quadros = [];
    for (let q = 0; q < 4; q++) {
      const pm = new Pixmap(9, 10);
      const barro = rgb("#a8653a");
      pm.elipse(4, 7.5, 3.6, 1.8, (x, y, nx) => cilindro(barro, nx));
      pm.rect(6, 6, 2, 1, barro);
      pm.set(3, 7, escurecer(barro, 0.4));
      chama(pm, 7, 5, 1.2, 4, q);
      quadros.push(pm.contorno(0.55).paraCanvas());
    }
    return { quadros, ax: 4, ay: 9 };
  });
}

export function barril() {
  return memo("barril", () => {
    const pm = new Pixmap(16, 19);
    const madeira = rgb("#7a5032");
    for (let y = 3; y <= 17; y++) {
      const bojo = Math.sin(((y - 3) / 14) * Math.PI) * 1.2;
      const hw = 6 + bojo;
      for (let x = 0; x < 16; x++) {
        const nx = (x + 0.5 - 8) / hw;
        if (Math.abs(nx) > 1) continue;
        let c = cilindro(madeira, nx);
        if (x % 3 === 0) c = escurecer(c, 0.12);
        if (y === 6 || y === 14) c = cilindro(rgb("#5a5660"), nx);
        pm.set(x, y, c);
      }
    }
    pm.elipse(8, 3.5, 6.2, 2.3, (x, y, nx, ny) => (Math.abs(nx) > 0.75 || Math.abs(ny) > 0.7 ? rgb("#5a5660") : (x + y) % 3 ? rgb("#8a6040") : rgb("#6a4428")));
    return saida(pm, 8, 17);
  });
}

export function caixote() {
  return memo("caixote", () => {
    const pm = new Pixmap(16, 16);
    const m = rgb("#9a7044");
    // topo
    for (let y = 1; y <= 5; y++) for (let x = 1; x <= 14; x++) pm.set(x, y, y % 2 ? clarear(m, 0.15) : clarear(m, 0.05));
    // frente
    for (let y = 6; y <= 14; y++) {
      for (let x = 1; x <= 14; x++) {
        let c = m;
        if (y === 6 || y === 14 || x === 1 || x === 14) c = escurecer(m, 0.25);
        if (x - 1 === y - 6 || 14 - x === y - 6) c = escurecer(m, 0.15);
        pm.set(x, y, c);
      }
    }
    return saida(pm, 8, 15);
  });
}

export function saco() {
  return memo("saco", () => {
    const pm = new Pixmap(14, 14);
    const pano = rgb("#c8b088");
    pm.elipse(7, 8.5, 5.5, 4.8, (x, y, nx, ny) => (nx > 0.45 || ny > 0.6 ? escurecer(pano, 0.22) : nx < -0.4 ? clarear(pano, 0.12) : pano));
    pm.rect(5, 2, 4, 3, pano);
    pm.rect(5, 4, 4, 1, escurecer(pano, 0.3));
    pm.set(6, 2, clarear(pano, 0.2));
    return saida(pm, 7, 13);
  });
}

export function anfora(cor = "#b86a3e") {
  return memo("anfora" + cor, () => {
    const pm = new Pixmap(12, 22);
    const barro = rgb(cor);
    for (let y = 2; y <= 20; y++) {
      let hw;
      if (y < 5) hw = 2;
      else if (y < 8) hw = 2 + (y - 5) * 1.1;
      else if (y < 15) hw = 5.2;
      else hw = 5.2 - (y - 15) * 0.9;
      for (let x = 0; x < 12; x++) {
        const nx = (x + 0.5 - 6) / hw;
        if (Math.abs(nx) <= 1) pm.set(x, y, cilindro(barro, nx));
      }
    }
    pm.elipse(6, 2, 2.6, 1, escurecer(barro, 0.5));
    pm.rect(1, 6, 1, 4, escurecer(barro, 0.15));
    pm.rect(10, 6, 1, 4, escurecer(barro, 0.35));
    for (let x = 2; x < 10; x++) pm.set(x, 11, escurecer(cilindro(barro, (x + 0.5 - 6) / 5.2), 0.2));
    return saida(pm, 6, 20);
  });
}

export function vasoPlanta(variante = 0) {
  return memo("vasoPlanta" + variante, () => {
    const pm = new Pixmap(16, 22);
    const barro = rgb("#a85a36");
    for (let y = 13; y <= 20; y++) {
      const hw = 5 - (y - 13) * 0.25;
      for (let x = 0; x < 16; x++) {
        const nx = (x + 0.5 - 8) / hw;
        if (Math.abs(nx) <= 1) pm.set(x, y, cilindro(barro, nx));
      }
    }
    pm.rect(2, 12, 12, 2, clarear(barro, 0.15));
    const folha = rgb(variante ? "#4a7a3a" : "#5a8a3a");
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 2 + hash(i, variante, 1) * 5;
      const x = Math.round(8 + Math.cos(a) * r);
      const y = Math.round(8 + Math.sin(a) * r * 0.7);
      pm.set(x, y, hash(i, 2, 3) > 0.5 ? folha : clarear(folha, 0.2));
      pm.set(x, y + 1, escurecer(folha, 0.2));
    }
    pm.elipse(8, 8, 4, 3, (x, y, nx, ny) => (ny < -0.2 ? clarear(folha, 0.2) : folha));
    if (variante === 1) {
      pm.set(6, 5, rgb("#f06a8a"));
      pm.set(10, 7, rgb("#f0e070"));
      pm.set(8, 4, rgb("#f0f0f0"));
    }
    return saida(pm, 8, 20);
  });
}

export function almofada(cor = "#8a3a6a") {
  return memo("almofada" + cor, () => {
    const pm = new Pixmap(14, 9);
    const c = rgb(cor);
    pm.elipse(7, 4.5, 6.4, 3.4, (x, y, nx, ny) => (ny < -0.3 ? clarear(c, 0.2) : ny > 0.45 ? escurecer(c, 0.25) : c));
    pm.set(1, 2, rgb("#e0c060"));
    pm.set(12, 2, rgb("#e0c060"));
    return saida(pm, 7, 8);
  });
}

// Portão de madeira na parede (2 tiles de largura e altura).
export function portao(aberto = false) {
  return memo("portao" + aberto, () => {
    const pm = new Pixmap(32, 32);
    const m = rgb("#6a4026");
    const ferro = rgb("#3a3440");
    // batente de pedra
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (x < 2 || x > 29 || y < 2) pm.set(x, y, (x + y) % 5 === 0 ? rgb("#8a7a64") : rgb("#a8987e"));
      }
    }
    if (aberto) {
      for (let y = 2; y < 32; y++) {
        for (let x = 2; x < 30; x++) {
          const fundo = misturar(rgb("#120c1c"), rgb("#2a1e2a"), y / 32);
          pm.set(x, y, fundo);
        }
      }
      // folhas abertas, vistas de lado
      pm.rect(2, 2, 3, 30, escurecer(m, 0.2));
      pm.rect(27, 2, 3, 30, escurecer(m, 0.35));
      return saida(pm, 16, 31, false);
    }
    for (let y = 2; y < 32; y++) {
      for (let x = 2; x < 30; x++) {
        let c = m;
        const tabua = Math.floor((x - 2) / 4);
        c = misturar(m, rgb("#7a4c2e"), hash(tabua, 0, 9));
        if ((x - 2) % 4 === 0) c = escurecer(m, 0.35);
        if ((x - 2) % 4 === 1) c = clarear(c, 0.08);
        if (x === 15 || x === 16) c = escurecer(m, 0.45);
        pm.set(x, y, c);
      }
    }
    for (const y of [7, 24]) {
      for (let x = 3; x < 29; x++) pm.set(x, y, x % 4 === 1 ? clarear(ferro, 0.4) : ferro);
    }
    // fechadura com mostrador
    pm.rect(13, 13, 6, 7, rgb("#8a6a2a"));
    pm.rect(14, 14, 4, 4, rgb("#2a2018"));
    pm.set(13, 13, rgb("#d8b048"));
    pm.set(15, 15, rgb("#d8b048"));
    pm.set(16, 16, rgb("#d8b048"));
    return saida(pm, 16, 31, false);
  });
}

// Fonte/cisterna com água e balde.
export function cisterna() {
  return memo("cisterna", () => {
    const pm = new Pixmap(30, 22);
    const pedra = rgb("#a89c86");
    for (let y = 4; y <= 19; y++) {
      for (let x = 1; x <= 28; x++) {
        let c = pedra;
        if (y <= 6) c = clarear(pedra, 0.15);
        if (y >= 17) c = escurecer(pedra, 0.25);
        if ((x + (y > 10 ? 3 : 0)) % 7 === 0 && y > 6) c = escurecer(pedra, 0.3);
        if (y === 11 && x > 1) c = escurecer(pedra, 0.25);
        pm.set(x, y, c);
      }
    }
    // água
    for (let y = 6; y <= 9; y++) for (let x = 4; x <= 25; x++) pm.set(x, y, y === 6 ? rgb("#2e5a7a") : rgb("#3e7aa2"));
    pm.rect(8, 7, 4, 1, rgb("#a8d8f0"));
    pm.rect(18, 8, 3, 1, rgb("#8ac0e0"));
    // balde
    const madeira = rgb("#7a5032");
    pm.rect(23, 12, 6, 6, madeira);
    pm.rect(23, 12, 6, 1, clarear(madeira, 0.2));
    pm.rect(23, 15, 6, 1, rgb("#4a4650"));
    pm.rect(24, 10, 4, 1, rgb("#4a4650"));
    pm.set(23, 11, rgb("#4a4650"));
    pm.set(28, 11, rgb("#4a4650"));
    return saida(pm, 15, 20);
  });
}

// Guirlanda de tecido/flores entre dois pontos (desenhada direto no contexto).
export function desenharGuirlanda(ctx, x0, y0, x1, y1, curva, t, cores = ["#d84a4a", "#f0d050", "#4a8ad8", "#f0f0e8"]) {
  const passos = Math.max(8, Math.round(Math.abs(x1 - x0) / 2));
  let antes = null;
  for (let i = 0; i <= passos; i++) {
    const u = i / passos;
    const x = Math.round(x0 + (x1 - x0) * u);
    const y = Math.round(y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * curva + Math.sin(t * 1.3 + u * 6) * 0.4);
    ctx.fillStyle = "#3a2a20";
    ctx.fillRect(x, y, 1, 1);
    if (i % 4 === 2 && antes) {
      ctx.fillStyle = cores[(i / 4) % cores.length | 0];
      ctx.fillRect(x - 1, y + 1, 3, 2);
      ctx.fillRect(x, y + 3, 1, 1);
    }
    antes = [x, y];
  }
}

// ---------------- Poço de Jacó ----------------

export function poco() {
  return memo("poco", () => {
    const W = 46;
    const H = 40;
    const pm = new Pixmap(W, H);
    const pedra = rgb("#b2a184");
    const cx = 23;
    const cy = 20;
    const rx = 19;
    const ry = 8;
    // parede frontal do poço (meio cilindro)
    for (let x = cx - rx; x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const yTopo = Math.round(cy + Math.sqrt(Math.max(0, 1 - nx * nx)) * ry);
      for (let y = cy; y <= yTopo + 11; y++) {
        const fil = Math.floor((y - yTopo + 20) / 4);
        const bloco = Math.floor((x + fil * 3) / 6);
        let c = misturar(pedra, rgb("#9a8a6e"), hash(bloco, fil, 4));
        c = cilindro(c, nx, 1.1);
        if ((y - yTopo + 20) % 4 === 0 || (x + fil * 3) % 6 === 0) c = escurecer(c, 0.3);
        if (y > yTopo + 8) c = escurecer(c, 0.15);
        pm.set(x, y, c);
      }
    }
    // borda superior (anel)
    pm.elipse(cx, cy, rx, ry, (x, y, nx, ny) => {
      const ang = Math.atan2(ny, nx);
      const seg = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 18);
      let c = misturar(pedra, rgb("#c8b898"), hash(seg, 2, 3));
      if (ny < -0.3) c = clarear(c, 0.15);
      if (seg % 2 === 0 && Math.abs(Math.sin(ang * 9)) < 0.15) c = escurecer(c, 0.25);
      return c;
    });
    // boca escura com água no fundo
    pm.elipse(cx, cy - 0.5, rx - 6, ry - 3, (x, y, nx, ny) => (ny < -0.1 ? rgb("#120e18") : rgb("#1c1826")));
    pm.elipse(cx + 2, cy + 1.5, 6, 1.4, rgb("#243a50"));
    pm.rect(cx, cy + 1, 3, 1, rgb("#6a9ab8"));
    // estrutura de madeira e corda
    const madeira = rgb("#6e4a2c");
    for (const px of [5, 40]) {
      for (let y = 2; y <= 22; y++) {
        pm.set(px, y, clarear(madeira, 0.1));
        pm.set(px + 1, y, escurecer(madeira, 0.25));
      }
    }
    for (let x = 4; x <= 42; x++) {
      pm.set(x, 2, clarear(madeira, 0.2));
      pm.set(x, 3, madeira);
      pm.set(x, 4, escurecer(madeira, 0.3));
    }
    // corda + balde
    for (let y = 5; y <= 12; y++) pm.set(cx, y, rgb("#c8b080"));
    pm.rect(cx - 2, 12, 5, 4, rgb("#7a5032"));
    pm.rect(cx - 2, 12, 5, 1, rgb("#9a7050"));
    pm.rect(cx - 2, 14, 5, 1, rgb("#4a4650"));
    return saida(pm, cx, 34);
  });
}

export function cantaro() {
  return memo("cantaro", () => {
    const pm = new Pixmap(12, 15);
    const barro = rgb("#b5653a");
    for (let y = 3; y <= 13; y++) {
      let hw = y < 5 ? 2.2 : y < 7 ? 2.2 + (y - 5) * 1.5 : y < 11 ? 5 : 5 - (y - 11) * 1.2;
      for (let x = 0; x < 12; x++) {
        const nx = (x + 0.5 - 6) / hw;
        if (Math.abs(nx) <= 1) pm.set(x, y, cilindro(barro, nx));
      }
    }
    pm.elipse(6, 3, 2.6, 1, escurecer(barro, 0.5));
    for (let x = 2; x < 10; x++) pm.set(x, 8, x % 2 ? rgb("#e0b070") : escurecer(barro, 0.2));
    pm.rect(10, 5, 1, 4, escurecer(barro, 0.3));
    return saida(pm, 6, 13);
  });
}

// Oliveira: tronco (entidade) e copa (primeiro plano).
export function troncoOliveira(variante = 0) {
  return memo("tronco" + variante, () => {
    const pm = new Pixmap(18, 26);
    const casca = rgb("#6a5a4a");
    for (let y = 4; y <= 24; y++) {
      const torc = Math.round(Math.sin(y * 0.35 + variante) * 1.5);
      const hw = y > 20 ? 4 + (y - 20) * 0.6 : 2.6;
      for (let x = 0; x < 18; x++) {
        const nx = (x + 0.5 - 9 - torc) / hw;
        if (Math.abs(nx) > 1) continue;
        let c = cilindro(casca, nx);
        if (hash(x, y, 7) > 0.82) c = escurecer(c, 0.2);
        if ((x + y * 2) % 7 === 0) c = clarear(c, 0.12);
        pm.set(x, y, c);
      }
    }
    return saida(pm, 9, 24);
  });
}

export function copaArvore(variante = 0, tipo = "oliveira") {
  return memo("copa" + tipo + variante, () => {
    const W = 56;
    const H = 44;
    const pm = new Pixmap(W, H);
    const folha = rgb(tipo === "oliveira" ? "#5f7a46" : "#4a7a36");
    const escura = escurecer(folha, 0.38);
    const clara = clarear(folha, tipo === "oliveira" ? 0.28 : 0.22);
    const prata = rgb("#a8b890");
    const blobs = [];
    for (let i = 0; i < 9; i++) {
      blobs.push([
        12 + hash(i, variante, 1) * 32,
        10 + hash(variante, i, 2) * 20,
        8 + hash(i, i, variante + 3) * 6,
      ]);
    }
    // camada de sombra, depois folhagem iluminada por cima-esquerda
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let dentro = false;
        let luz = -1;
        for (const [bx, by, br] of blobs) {
          const dx = x + 0.5 - bx;
          const dy = (y + 0.5 - by) * 1.15;
          const d = Math.sqrt(dx * dx + dy * dy);
          const borda = br + (ruido(x, y, 3, 5 + variante) - 0.5) * 3.5;
          if (d < borda) {
            dentro = true;
            luz = Math.max(luz, (-dx - dy * 1.2) / br);
          }
        }
        if (!dentro) continue;
        const n = ruido(x, y, 2.2, 9 + variante);
        let c = folha;
        if (luz > 0.55 && n > 0.35) c = clara;
        else if (luz < -0.35 || n < 0.22) c = escura;
        if (tipo === "oliveira" && hash(x, y, 13) > 0.93) c = prata;
        if (y > H * 0.72) c = escurecer(c, 0.15);
        pm.set(x, y, c);
      }
    }
    if (tipo === "oliveira") {
      for (let i = 0; i < 8; i++) {
        const x = Math.round(10 + hash(i, 3, variante) * 36);
        const y = Math.round(10 + hash(3, i, variante) * 22);
        if (pm.get(x, y)) pm.set(x, y, rgb("#2e2a3a"));
      }
    }
    pm.contorno(0.55);
    return { img: pm.paraCanvas(), ax: W / 2, ay: H - 6 };
  });
}

export function palmeira(variante = 0) {
  return memo("palmeira" + variante, () => {
    const W = 48;
    const H = 64;
    const pm = new Pixmap(W, H);
    const casca = rgb("#8a6a48");
    // tronco curvo com anéis
    for (let y = 18; y <= 62; y++) {
      const t = (62 - y) / 44;
      const cx = 24 + Math.sin(t * 1.6 + variante) * 5 * t;
      for (let x = Math.floor(cx - 2); x <= Math.ceil(cx + 1); x++) {
        const nx = (x + 0.5 - cx) / 2.4;
        let c = cilindro(casca, nx);
        if (y % 3 === 0) c = escurecer(c, 0.25);
        pm.set(x, y, c);
      }
    }
    const topoX = 24 + Math.sin(1.6 + variante) * 5;
    const folha = rgb("#4f8a3a");
    for (let f = 0; f < 9; f++) {
      const ang = -Math.PI / 2 + (f - 4) * 0.42 + Math.sin(f * 7 + variante) * 0.1;
      const comp = 17 + hash(f, variante, 1) * 6;
      for (let s = 0; s < comp; s++) {
        const curva = s * s * 0.012;
        const x = topoX + Math.cos(ang) * s;
        const y = 18 + Math.sin(ang) * s * 0.75 + curva * 6;
        const c = s < comp * 0.3 ? escurecer(folha, 0.1) : f % 2 ? folha : clarear(folha, 0.15);
        pm.set(x, y, c);
        if (s % 2 === 0 && s > 3) {
          pm.set(x, y + 1, escurecer(folha, 0.3));
          pm.set(x + (Math.cos(ang) > 0 ? -1 : 1), y + 2, escurecer(folha, 0.2));
        }
      }
    }
    pm.elipse(topoX, 18, 2.5, 2, rgb("#6a4a2a"));
    pm.contorno(0.55);
    return { img: pm.paraCanvas(), ax: 24, ay: 61 };
  });
}

export function arbusto(variante = 0) {
  return memo("arbusto" + variante, () => {
    const pm = new Pixmap(20, 15);
    const f = rgb(variante % 2 ? "#5a8040" : "#4e7438");
    pm.elipse(10, 8, 9, 6, (x, y, nx, ny) => {
      const n = ruido(x, y, 2, variante);
      if (ny < -0.3 && n > 0.4) return clarear(f, 0.25);
      if (ny > 0.4 || n < 0.25) return escurecer(f, 0.3);
      return f;
    });
    if (variante === 2) {
      pm.set(6, 5, rgb("#f0d050"));
      pm.set(12, 4, rgb("#f0f0e0"));
      pm.set(14, 7, rgb("#f0d050"));
    }
    return saida(pm, 10, 13);
  });
}

export function rocha(variante = 0) {
  return memo("rocha" + variante, () => {
    const pm = new Pixmap(18, 13);
    const p = rgb(variante % 2 ? "#9a8e7a" : "#8a8070");
    pm.elipse(9, 7, 8, 5, (x, y, nx, ny) => {
      if (ny < -0.35 && nx < 0.3) return clarear(p, 0.25);
      if (nx > 0.5 || ny > 0.5) return escurecer(p, 0.3);
      return hash(x, y, variante) > 0.85 ? escurecer(p, 0.1) : p;
    });
    pm.set(5, 9, rgb("#6a8a4a"));
    pm.set(6, 10, rgb("#5a7a3a"));
    return saida(pm, 9, 11);
  });
}

export function capim(variante = 0) {
  return memo("capim" + variante, () => {
    const pm = new Pixmap(9, 8);
    const g = rgb(variante % 2 ? "#7a9a48" : "#6a8a3e");
    for (let i = 0; i < 6; i++) {
      const x = 1 + i + (i > 2 ? 1 : 0);
      const alt = 3 + Math.floor(hash(i, variante, 5) * 4);
      for (let y = 0; y < alt; y++) pm.set(x + (y > 2 ? (i % 2 ? 1 : -1) : 0), 7 - y, y > alt - 2 ? clarear(g, 0.2) : g);
    }
    if (variante === 2) pm.set(4, 1, rgb("#e8e070"));
    return { img: pm.paraCanvas(), ax: 4, ay: 7 };
  });
}

// Porta de pedra da passagem, com dois encaixes para símbolos.
export function portaPedra() {
  return memo("portaPedra", () => {
    const pm = new Pixmap(32, 34);
    const p = rgb("#7e7468");
    for (let y = 0; y < 34; y++) {
      for (let x = 0; x < 32; x++) {
        let c = misturar(p, rgb("#6a6258"), fbm(x, y, 8, 3, 2));
        if (x < 2 || x > 29 || y < 2) c = escurecer(p, 0.35);
        else if (x === 2 || y === 2) c = clarear(c, 0.2);
        else if (x === 29) c = escurecer(c, 0.25);
        pm.set(x, y, c);
      }
    }
    // dois encaixes circulares
    for (const ex of [10, 22]) {
      pm.elipse(ex, 15, 5, 5, (x, y, nx, ny) => (ny < -0.2 && nx < 0.2 ? escurecer(p, 0.45) : escurecer(p, 0.3)));
      pm.elipse(ex, 15, 3.6, 3.6, rgb("#3a342e"));
    }
    // inscrições gastas
    for (let x = 5; x < 27; x += 2) pm.set(x, 26, escurecer(p, 0.3));
    for (let x = 6; x < 26; x += 3) pm.set(x, 28, escurecer(p, 0.25));
    return saida(pm, 16, 33, false);
  });
}

// ---------------- Betesda ----------------

export function coluna(quebrada = false) {
  return memo("coluna" + quebrada, () => {
    const W = 22;
    const H = quebrada ? 34 : 60;
    const pm = new Pixmap(W, H);
    const p = rgb("#b4aa98");
    const cx = 11;
    const topoFuste = quebrada ? 8 : 12;
    // base (plinto)
    for (let y = H - 8; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const nx = (x + 0.5 - cx) / 10;
        let c = cilindro(p, nx);
        if (y === H - 8) c = clarear(c, 0.15);
        if (y === H - 5) c = escurecer(c, 0.2);
        pm.set(x, y, c);
      }
    }
    // fuste canelado
    for (let y = topoFuste; y < H - 8; y++) {
      for (let x = 4; x < W - 4; x++) {
        const nx = (x + 0.5 - cx) / 7;
        let c = cilindro(p, nx);
        if ((x - 4) % 3 === 0) c = escurecer(c, 0.14);
        if (hash(x, y, 5) > 0.93) c = escurecer(c, 0.12);
        if (y > H - 16 && fbm(x, y, 6, 7, 2) > 0.6) c = misturar(c, rgb("#5a6a4a"), 0.5);
        pm.set(x, y, c);
      }
    }
    if (quebrada) {
      // topo quebrado irregular
      for (let x = 4; x < W - 4; x++) {
        const corte = topoFuste + Math.floor(hash(x, 1, 3) * 4);
        for (let y = topoFuste; y < corte; y++) pm.apagar(x, y);
        pm.set(x, corte, clarear(p, 0.25));
      }
    } else {
      // capitel
      for (let y = 2; y < 12; y++) {
        const largura = y < 5 ? 10 : 10 - (y - 5) * 0.45;
        for (let x = 0; x < W; x++) {
          const nx = (x + 0.5 - cx) / largura;
          if (Math.abs(nx) > 1) continue;
          let c = cilindro(p, nx);
          if (y === 2) c = clarear(c, 0.25);
          if (y === 4 || y === 8) c = escurecer(c, 0.18);
          pm.set(x, y, c);
        }
      }
      // volutas
      for (const vx of [2, W - 3]) {
        pm.set(vx, 6, escurecer(p, 0.35));
        pm.set(vx, 7, escurecer(p, 0.2));
      }
    }
    pm.contorno(0.6);
    return { img: pm.paraCanvas(), ax: cx, ay: H - 2 };
  });
}

export function braseiro() {
  return memo("braseiro", () => {
    const quadros = [];
    for (let q = 0; q < 4; q++) {
      const pm = new Pixmap(16, 24);
      const ferro = rgb("#4a4248");
      pm.linha(4, 14, 2, 22, ferro);
      pm.linha(11, 14, 13, 22, ferro);
      pm.linha(8, 15, 8, 22, escurecer(ferro, 0.2));
      for (let x = 2; x <= 13; x++) {
        pm.set(x, 12, clarear(ferro, 0.3));
        pm.set(x, 13, ferro);
        if (x > 2 && x < 13) pm.set(x, 14, escurecer(ferro, 0.2));
      }
      for (let x = 4; x <= 11; x++) pm.set(x, 11, hash(x, q, 3) > 0.5 ? rgb("#ff6a2a") : rgb("#c83a1a"));
      chama(pm, 8, 10, 3.2, 8, q);
      quadros.push(pm.contorno(0.55).paraCanvas());
    }
    return { quadros, ax: 8, ay: 22 };
  });
}

export function macaVazia() {
  return memo("macaVazia", () => {
    const pm = new Pixmap(28, 10);
    const palha = rgb("#a88a52");
    pm.rect(1, 2, 26, 6, palha);
    for (let x = 1; x < 27; x += 2) pm.set(x, 3, escurecer(palha, 0.15));
    pm.rect(1, 2, 26, 1, clarear(palha, 0.18));
    pm.rect(1, 7, 26, 1, escurecer(palha, 0.3));
    return { img: pm.paraCanvas(), ax: 14, ay: 7 };
  });
}

// Pequeno pedestal com mecanismo (enigma final).
export function pedestal() {
  return memo("pedestal", () => {
    const pm = new Pixmap(16, 20);
    const p = rgb("#9a907e");
    for (let y = 4; y < 19; y++) {
      for (let x = 2; x < 14; x++) {
        const nx = (x + 0.5 - 8) / 6;
        let c = cilindro(p, nx);
        if (y === 4) c = clarear(c, 0.3);
        if (y === 7 || y === 16) c = escurecer(c, 0.2);
        pm.set(x, y, c);
      }
    }
    pm.elipse(8, 4, 6, 2, clarear(p, 0.2));
    pm.elipse(8, 4, 3, 1.2, rgb("#3a3440"));
    return saida(pm, 8, 18);
  });
}

// Água animada (tanque, poça, cisterna): desenha brilhos sobre a base escura.
export function desenharAgua(ctx, x, y, w, h, t, camX, camY, cores = {}) {
  const claro = cores.claro || "rgba(170,210,240,0.55)";
  const medio = cores.medio || "rgba(110,160,200,0.35)";
  const x0 = Math.max(x, camX - 4);
  const y0 = Math.max(y, camY - 4);
  const x1 = Math.min(x + w, camX + 640);
  const y1 = Math.min(y + h, camY + 400);
  for (let py = Math.floor(y0 / 3) * 3; py < y1; py += 3) {
    for (let px = Math.floor(x0 / 7) * 7; px < x1; px += 7) {
      const fase = hash(px, py, 7) * 6.28;
      const v = Math.sin(t * 1.6 + fase + px * 0.05);
      if (v > 0.82) {
        ctx.fillStyle = claro;
        ctx.fillRect(px + Math.round(Math.sin(t + fase) * 2), py, 3, 1);
      } else if (v > 0.55) {
        ctx.fillStyle = medio;
        ctx.fillRect(px + 1, py, 2, 1);
      }
    }
  }
}

export { criarCanvas };
