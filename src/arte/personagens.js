// Gerador de sprites de personagens (16x24) em pixel art.
// Cada personagem é montado por camadas: corpo, roupa, cabelo, cobertura,
// manto e acessórios, nas 4 direções, com respiração, caminhada e gesto.
import { Pixmap, rgb, escurecer, clarear, misturar, criarCanvas } from "./pixel.js";

export const LARG = 16;
export const ALT = 24;
export const DIRECOES = ["baixo", "esq", "dir", "cima"];
// Colunas da folha: 0-1 parado, 2-5 andando, 6 gesto.
export const COLUNAS = { parado: [0, 1], andar: [2, 3, 4, 5], gesto: [6] };

// ---------- Máscaras de cabelo (h = cabelo, H = sombra, i = brilho, x = enfeite) ----------
const CABELO = {
  curto: {
    baixo: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "...hhhhhhhhhH...",
      "...hh.Hh..hhH...",
      "...H........H...",
    ],
    dir: [
      "......hhhhh.....",
      ".....hiiihhh....",
      "....hiihhhhhh...",
      "....hhhhhhhhh...",
      "....hhhhhh......",
      "....hhhH........",
      "....hhH.........",
      "....hH..........",
      ".....H..........",
    ],
    cima: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhHH...",
      "...HhhhhhhhHH...",
      "....HHhhhhHH....",
      ".....HHHHHH.....",
    ],
  },
  longo: {
    baixo: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhh...",
      "..hhhhhhhhhhhH..",
      "..hhh.hhhh.hhH..",
      "..hh........hH..",
      "..hh........HH..",
      "..hH........HH..",
      "..hH........HH..",
      "..HH........HH..",
      "..HH........HH..",
      "..HH........HH..",
      "...H........H...",
    ],
    dir: [
      "......hhhhh.....",
      ".....hiiihhh....",
      "....hiihhhhhh...",
      "...hhhhhhhhhh...",
      "...hhhhhhh......",
      "...hhhhH........",
      "...hhhH.........",
      "...hhhH.........",
      "...hhHH.........",
      "...hhH..........",
      "...hHH..........",
      "...HH...........",
      "...H............",
    ],
    cima: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhHH..",
      "..hhhhhhhhhhHH..",
      "..hhhhhhhhhhHH..",
      "..hhhhhhhhhhHH..",
      "...hhhhhhhhHH...",
      "...hhhhhhhhHH...",
      "....HhhhhhHH....",
      ".....HHHHHH.....",
    ],
  },
  cacheado: {
    baixo: [
      "....hihhhihh....",
      "...hiihhihhhh...",
      "..hhhihhhhihhh..",
      ".hhhhhhhhhhhhhH.",
      ".hhhh.hhhh.hhHH.",
      ".hhh........hHH.",
      ".hhH........HHH.",
      ".hhH........HHH.",
      "..hH........HH..",
      "..HH........HH..",
      "...H........H...",
    ],
    dir: [
      ".....hhihh......",
      "....hiihhhhh....",
      "...hhhihhhhhh...",
      "..hhhhhhhhhhhh..",
      "..hhhhhhhh......",
      "..hhhhhH........",
      "..hhhhH.........",
      "..hhhHH.........",
      "...hHH..........",
      "...HH...........",
    ],
    cima: [
      "....hihhhihh....",
      "...hiihhihhhh...",
      "..hhhihhhhihhh..",
      ".hhhhhhhhhhhhhH.",
      ".hhhhhhhhhhhhHH.",
      ".hhhhhhhhhhhhHH.",
      ".hhhhhhhhhhhhHH.",
      ".hhhhhhhhhhhHHH.",
      "..hhhhhhhhhHHH..",
      "..HhhhhhhhhHHH..",
      "...HHHHHHHHHH...",
    ],
  },
  rabo: {
    baixo: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "...hhhhhhhhhH...",
      "...hh......hH...",
      "...H........H...",
    ],
    dir: [
      "......hhhhh.....",
      ".....hiiihhh....",
      "....hiihhhhhh...",
      "...xhhhhhhhhh...",
      "..hhhhhhhh......",
      "..hh.hhH........",
      ".hH..hH.........",
      ".hH.............",
      ".HH.............",
      "..H.............",
    ],
    cima: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhxxhhHH...",
      "...HhhhhhhhHH...",
      "....HHhhhHHH....",
      ".....HHhhHH.....",
      ".......hH.......",
      ".......hH.......",
      ".......HH.......",
      "........H.......",
    ],
  },
  trancas: {
    baixo: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hihhhhhhhH...",
      "..hhhhhhhhhhhH..",
      "..hhh.h..h.hhH..",
      "..hh........HH..",
      "..Hh........hH..",
      "..hH........Hh..",
      "..Hh........hH..",
      "..hH........Hh..",
      "..Hh........hH..",
      "..hH........Hh..",
      "..xx........xx..",
    ],
    dir: [
      "......hhhhh.....",
      ".....hiiihhh....",
      "....hiihhhhhh...",
      "...hhhhhhhhhh...",
      "...hhhhhhh......",
      "...hhhhH........",
      "...HhhH.........",
      "...hH...........",
      "...Hh...........",
      "...hH...........",
      "...Hh...........",
      "...hH...........",
      "...xx...........",
    ],
    cima: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhHH..",
      "..HhhhhhhhhhHH..",
      "...HhhHhhHhhH...",
      "....hH...hH.....",
      "....Hh...Hh.....",
      "....hH...hH.....",
      "....Hh...Hh.....",
      "....xx...xx.....",
    ],
  },
  raspado: {
    baixo: [
      "................",
      "....hhhhhhhh....",
      "...hhihhhhhhH...",
      "...H........H...",
    ],
    dir: [
      "................",
      ".....hhhhhh.....",
      "....hhihhhhhh...",
      "....hhhhh.......",
      "....hhh.........",
      "....H...........",
    ],
    cima: [
      "................",
      "....hhhhhhhh....",
      "...hhihhhhhhH...",
      "...hhhhhhhhhH...",
      "...hhhhhhhhhH...",
      "...HhhhhhhhhH...",
      "...HhhhhhhhHH...",
      "....HhhhhhhH....",
      ".....HHHHHH.....",
    ],
  },
  // Cabelo na altura do queixo (chanel), com franja de lado.
  medio: {
    baixo: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhh...",
      "..hhhhhhhhhhhH..",
      "..hhhh.hhh.hhH..",
      "..hh........hH..",
      "..hh........HH..",
      "..hH........HH..",
      "..hH........HH..",
      "..HH........HH..",
      "..HH........HH..",
    ],
    dir: [
      "......hhhhh.....",
      ".....hiiihhh....",
      "....hiihhhhhh...",
      "...hhhhhhhhhh...",
      "...hhhhhhh......",
      "...hhhhH........",
      "...hhhH.........",
      "...hhhH.........",
      "...hhHH.........",
      "...hHH..........",
      "...HH...........",
    ],
    cima: [
      ".....hhhhhh.....",
      "....hiiiihhh....",
      "...hiihhhhhhH...",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhhH..",
      "..hhhhhhhhhhHH..",
      "..hhhhhhhhhhHH..",
      "..hhhhhhhhhhHH..",
      "..HhhhhhhhhhHH..",
      "...HHHHHHHHHH...",
    ],
  },
  // Cachos no alto da cabeça e laterais baixinhas (degradê).
  cachosCurtos: {
    baixo: [
      "....hhihhihh....",
      "...hihhihhhih...",
      "..hhhhihhhhihH..",
      "...hhhhhhhhhH...",
      "...H........H...",
      "...H........H...",
    ],
    dir: [
      ".....hhihhh.....",
      "....hihhihhh....",
      "...hhhhhhhihh...",
      "....hhhhhhhh....",
      "....HHhhh.......",
      "....HH..........",
      "....H...........",
    ],
    cima: [
      "....hhihhihh....",
      "...hihhihhhih...",
      "..hhhhihhhhihH..",
      "...hhhhhhhhhH...",
      "...HhhhhhhhhH...",
      "...HHhhhhhhHH...",
      "...HHHHHHHHHH...",
      "....HHHHHHHH....",
    ],
  },
};

// Cavanhaque (barba só no queixo e bigode fino).
const CAVANHAQUE = {
  baixo: [
    null, null, null, null, null, null, null, null,
    "......h..h......",
    "......hhhh......",
    ".......HH.......",
  ],
  dir: [
    null, null, null, null, null, null, null, null,
    "...........h....",
    "..........hh....",
    ".........hH.....",
  ],
};

const BARBA = {
  baixo: [
    null, null, null, null, null, null, null,
    "...h........h...",
    "....hhh..hhh....",
    ".....hhhhhh.....",
    "......hHHh......",
  ],
  dir: [
    null, null, null, null, null, null, null,
    ".......hh.......",
    "........hhhhh...",
    "........hhhhh...",
    ".........hhH....",
  ],
};

// ---------- Coberturas de cabeça (v = tecido, V = sombra, w = brilho, x = faixa) ----------
const COBERTURA = {
  veu: {
    baixo: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...vwwvvvvvvV...",
      "..vvhhhhhhhhvV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vvV......VVV..",
      "..vvvV....VVVV..",
      "..vvvvV..VVVVV..",
      "..vvvvvvvvvvVV..",
      "..vvvvvvvvvvVV..",
      "..VVVVVVVVVVVV..",
    ],
    dir: [
      "......vvvvv.....",
      ".....vwwwvvvv...",
      "....vwwvvvvvvv..",
      "...vvvvvvvhhh...",
      "...vvvvvvV......",
      "...vvvvvV.......",
      "...vvvvvV.......",
      "...vvvvvV.......",
      "...vvvvvV.......",
      "...vvvvvvV......",
      "...vvvvvvV......",
      "...vvvvvvvV.....",
      "...vvvvvvvV.....",
      "...VVVVVVVV.....",
    ],
    cima: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...vwwvvvvvvV...",
      "..vvvvvvvvvvvV..",
      "..vvvvvvvvvvvV..",
      "..vvvvVvvvvvvV..",
      "..vvvvVvvvvvVV..",
      "..vvvvvvvvVvVV..",
      "..vvvvvvvvVvVV..",
      "..vvVvvvvvvvVV..",
      "..vvVvvvvvvvVV..",
      "..vvvvvvVvvvVV..",
      "..vvvvvvVvvvVV..",
      "..vVvvvVvvvVvV..",
      "..VVVVVVVVVVVV..",
    ],
  },
  faixa: {
    baixo: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...xxxxxxxxxx...",
      "..vV........VV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vV........VV..",
      "..vvV......VVV..",
      "..vvV......VVV..",
      "..vvV......VVV..",
      "..vvvV....VVVV..",
    ],
    dir: [
      "......vvvvv.....",
      ".....vwwwvvvv...",
      "....xxxxxxxxx...",
      "...vvvvvV.......",
      "...vvvvvV.......",
      "...vvvvV........",
      "...vvvvV........",
      "...vvvvV........",
      "...vvvvV........",
      "...vvvvV........",
      "...vvvvvV.......",
      "...VVVVVV.......",
    ],
    cima: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...xxxxxxxxxx...",
      "..vvvvvvvvvvvV..",
      "..vvvvVvvvvvvV..",
      "..vvvvVvvvvvVV..",
      "..vvvvvvvvVvVV..",
      "..vvVvvvvvVvVV..",
      "..vvVvvvvvvvVV..",
      "..vvvvvvVvvvVV..",
      "..vvvvvvVvvvVV..",
      "..VVVVVVVVVVVV..",
    ],
  },
  bone: {
    baixo: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...vwwvvvvvvV...",
      "...xxxxxxxxxx...",
      "..xxxxxxxxxxxx..",
    ],
    dir: [
      "......vvvvv.....",
      ".....vwwwvvv....",
      "....vwwvvvvvv...",
      "....vvvvvvvxxxx.",
    ],
    cima: [
      ".....vvvvvv.....",
      "....vwwwvvvv....",
      "...vwwvvvvvvV...",
      "...vvvvvvvvvV...",
      "...VvvvvvvvvV...",
    ],
  },
};

function paleta(spec) {
  const pele = rgb(spec.pele);
  const cab = rgb(spec.cabelo || "#2a1a12");
  const top = rgb(spec.top || "#7a5a3a");
  const calca = rgb(spec.calca || "#3a3448");
  const sapato = rgb(spec.sapato || "#5a3a24");
  const acento = rgb(spec.acento || "#c8a050");
  const manto = rgb(spec.manto || "#7a2a2a");
  const cob = rgb(spec.corCobertura || "#d8c8a8");
  return {
    pele,
    peleSombra: escurecer(pele, 0.24),
    peleLuz: clarear(pele, 0.14),
    bochecha: misturar(pele, [236, 112, 112, 255], 0.28),
    boca: escurecer(misturar(pele, [190, 70, 80, 255], 0.35), 0.15),
    olho: rgb("#22182b"),
    h: cab,
    H: escurecer(cab, 0.32),
    i: clarear(cab, 0.28),
    top,
    topSombra: escurecer(top, 0.3),
    topLuz: clarear(top, 0.18),
    calca,
    calcaSombra: escurecer(calca, 0.3),
    calcaLuz: clarear(calca, 0.12),
    sapato,
    sapatoSombra: escurecer(sapato, 0.35),
    sapatoLuz: clarear(sapato, 0.25),
    x: acento,
    acentoSombra: escurecer(acento, 0.3),
    manto,
    mantoSombra: escurecer(manto, 0.32),
    mantoLuz: clarear(manto, 0.16),
    v: cob,
    V: escurecer(cob, 0.28),
    w: clarear(cob, 0.25),
  };
}

// ---------- Poses ----------
function pose(anim, i) {
  if (anim === "andar") {
    return [
      { bob: 0, pernaE: 0, pernaD: -1, bracoE: 1, bracoD: -1, passo: 0 },
      { bob: -1, pernaE: 0, pernaD: 0, bracoE: 0, bracoD: 0, passo: 1 },
      { bob: 0, pernaE: -1, pernaD: 0, bracoE: -1, bracoD: 1, passo: 2 },
      { bob: -1, pernaE: 0, pernaD: 0, bracoE: 0, bracoD: 0, passo: 3 },
    ][i];
  }
  if (anim === "gesto") return { bob: 0, pernaE: 0, pernaD: 0, bracoE: 0, bracoD: 0, passo: -1, gesto: true };
  return { bob: i === 1 ? 1 : 0, pernaE: 0, pernaD: 0, bracoE: 0, bracoD: 0, passo: -1 };
}

const ehRoupao = (spec) => spec.roupa === "tunica" || spec.roupa === "vestido";

// ---------- Vista de frente / costas ----------
function pernasFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  if (ehRoupao(spec)) {
    // Pés (sandálias) aparecendo sob a barra.
    const pes = [
      { x: 5, lift: ps.pernaE },
      { x: 8, lift: ps.pernaD },
    ];
    for (const p of pes) {
      const y = 22 + p.lift;
      pm.rect(p.x, y, 3, 1, costas ? P.sapatoSombra : P.pele);
      pm.rect(p.x, y + 1, 3, 1, P.sapato);
      if (!costas) pm.set(p.x + 1, y, P.sapato);
    }
    return;
  }
  const pernas = [
    { x: 5, lift: ps.pernaE, sx: 4 },
    { x: 8, lift: ps.pernaD, sx: 8 },
  ];
  for (const p of pernas) {
    const topo = 17 + u;
    const fim = 21 + p.lift;
    for (let y = topo; y <= fim; y++) {
      pm.set(p.x, y, p.x === 5 ? P.calcaLuz : P.calca);
      pm.set(p.x + 1, y, P.calca);
      pm.set(p.x + 2, y, P.calcaSombra);
    }
    const ys = 22 + p.lift;
    pm.rect(p.sx, ys, 4, 1, P.sapato);
    pm.rect(p.sx, ys + 1, 4, 1, P.sapatoSombra);
    pm.set(p.sx + (p.x === 5 ? 0 : 3), ys, P.sapatoLuz);
  }
}

function troncoFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  const fimTronco = ehRoupao(spec) ? 21 : 16;
  for (let y = 11 + u; y <= fimTronco + (ehRoupao(spec) ? 0 : u); y++) {
    const rel = y - (11 + u);
    let x0 = 4;
    let x1 = 11;
    if (ehRoupao(spec) && y >= 19) {
      // Barra em "A", balançando com o passo.
      x0 = 3 - (ps.passo === 0 ? 1 : 0);
      x1 = 12 + (ps.passo === 2 ? 1 : 0);
    }
    for (let x = x0; x <= x1; x++) {
      let c = P.top;
      if (x <= x0) c = P.topLuz;
      if (x >= x1 - 1) c = P.topSombra;
      if (rel === 0 && (x === x0 || x === x1)) continue; // ombros arredondados
      pm.set(x, y, c);
    }
    // Dobras verticais na túnica.
    if (ehRoupao(spec) && y >= 16 + u) {
      pm.set(7 + ((y + ps.passo) % 2 === 0 ? 0 : 0), y, P.topSombra);
      if (y >= 18) pm.set(9, y, escurecer(P.top, 0.14));
    }
  }
  // Barra / cinto.
  if (ehRoupao(spec)) {
    pm.rect(4, 15 + u, 8, 1, P.x);
    pm.set(10, 15 + u, P.acentoSombra);
    pm.set(11, 15 + u, P.acentoSombra);
    if (spec.roupa === "vestido") pm.rect(3, 21, 10, 1, P.acentoSombra);
  } else {
    pm.rect(4, 16 + u, 8, 1, P.topSombra);
    if (spec.jaqueta && !costas) {
      // Jaqueta aberta: camiseta por dentro e zíper.
      pm.rect(7, 12 + u, 2, 4, P.x);
      pm.set(8, 12 + u, P.acentoSombra);
      pm.set(6, 12 + u, P.topSombra);
      pm.set(9, 12 + u, P.topSombra);
    }
  }
  // Gola.
  if (!costas) {
    if (ehRoupao(spec)) {
      pm.set(6, 11 + u, P.peleSombra);
      pm.set(7, 11 + u, P.peleSombra);
      pm.set(8, 11 + u, P.peleSombra);
      pm.set(9, 11 + u, P.topSombra);
    } else {
      pm.set(6, 11 + u, P.topSombra);
      pm.set(9, 11 + u, P.topSombra);
      pm.set(7, 11 + u, P.peleSombra);
      pm.set(8, 11 + u, P.peleSombra);
    }
  }
}

function bracosFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  const manga = spec.mangaLonga || ehRoupao(spec) ? 3 : 2;
  const lados = [
    { x: 2, dy: ps.bracoE, interno: 3 },
    { x: 12, dy: ps.bracoD, interno: 12 },
  ];
  for (const b of lados) {
    if (ps.gesto && b.x === 12 && !costas) {
      // Braço levantado, explicando algo.
      pm.set(12, 11 + u, P.top);
      pm.set(13, 11 + u, P.topSombra);
      pm.set(13, 10 + u, P.top);
      pm.set(14, 10 + u, P.topSombra);
      pm.set(14, 9 + u, P.pele);
      pm.set(15, 9 + u, P.peleSombra);
      pm.set(14, 8 + u, P.pele);
      pm.set(15, 8 + u, P.peleSombra);
      continue;
    }
    const y0 = 11 + u + b.dy;
    for (let k = 0; k <= 5; k++) {
      const y = y0 + k;
      if (k === 0) {
        pm.set(b.interno, y, k < manga ? P.top : P.pele);
        continue;
      }
      const naManga = k <= manga;
      const cor = naManga ? P.top : P.pele;
      const corSombra = naManga ? P.topSombra : P.peleSombra;
      pm.set(b.x, y, b.x === 2 ? cor : corSombra);
      pm.set(b.x + 1, y, b.x === 2 ? corSombra : corSombra);
      if (b.x === 12) pm.set(12, y, cor);
    }
  }
}

function cabecaFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  const linhas = [
    [1, 5, 10],
    [2, 4, 11],
    [3, 3, 12],
    [4, 3, 12],
    [5, 3, 12],
    [6, 3, 12],
    [7, 3, 12],
    [8, 4, 11],
    [9, 5, 10],
  ];
  // Pescoço
  pm.rect(6, 10 + u, 4, 1, P.peleSombra);
  for (const [y, x0, x1] of linhas) {
    for (let x = x0; x <= x1; x++) {
      let c = P.pele;
      if (x === x1 || (x === x1 - 1 && (y === 2 || y === 8))) c = P.peleSombra;
      if (y === 9 && x >= 9) c = P.peleSombra;
      pm.set(x, y + u, c);
    }
  }
  pm.set(4, 3 + u, P.peleLuz);
  if (!costas) {
    pm.set(5, 5 + u, P.olho);
    pm.set(5, 6 + u, P.olho);
    pm.set(10, 5 + u, P.olho);
    pm.set(10, 6 + u, P.olho);
    pm.set(4, 7 + u, P.bochecha);
    pm.set(11, 7 + u, P.bochecha);
    pm.set(7, 8 + u, P.boca);
    pm.set(8, 8 + u, P.boca);
  }
}

function mantoFrente(pm, P, spec, ps, costas) {
  if (!spec.manto) return;
  const u = ps.bob;
  for (let y = 11 + u; y <= 20; y++) {
    const rel = y - (11 + u);
    if (costas) {
      for (let x = 3; x <= 12; x++) {
        let c = P.manto;
        if (x >= 11) c = P.mantoSombra;
        else if (x === 3) c = P.mantoLuz;
        else if ((x === 6 || x === 9) && rel > 2) c = escurecer(P.manto, 0.16);
        pm.set(x, y, c);
      }
      continue;
    }
    const borda = Math.min(11, 4 + Math.floor(rel * 0.8));
    for (let x = 1; x <= borda; x++) {
      if (y > 18 && x < 3) continue;
      let c = P.manto;
      if (x === borda) c = P.mantoSombra;
      else if (x === borda - 1) c = escurecer(P.manto, 0.12);
      else if (x <= 2 || rel === 0) c = P.mantoLuz;
      pm.set(x, y, c);
    }
  }
}

function desenharFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  const estilo = CABELO[spec.estilo];
  if (costas && spec.acessorios?.includes("mochila")) {
    // nada atrás do corpo nesta vista
  }
  pernasFrente(pm, P, spec, ps, costas);
  troncoFrente(pm, P, spec, ps, costas);
  bracosFrente(pm, P, spec, ps, costas);
  mantoFrente(pm, P, spec, ps, costas);
  cabecaFrente(pm, P, spec, ps, costas);
  if (!costas && spec.barba) pm.mascara(tipoBarba(spec).baixo.map((l) => l || ""), { h: P.h, H: P.H }, 0, u);
  if (estilo && !(spec.cobertura === "veu" && costas)) {
    pm.mascara(costas ? estilo.cima : estilo.baixo, P, 0, u);
  }
  if (spec.cobertura && COBERTURA[spec.cobertura]) {
    const m = COBERTURA[spec.cobertura][costas ? "cima" : "baixo"];
    pm.mascara(m, { ...P, h: P.h }, 0, u);
  }
  if (!costas) oculosFrente(pm, spec, u);
  acessoriosFrente(pm, P, spec, ps, costas);
}

const tipoBarba = (spec) => (spec.barba === "cavanhaque" ? CAVANHAQUE : BARBA);

// Óculos de grau (aro fino, olho aparecendo) ou escuros (lentes cheias).
function oculosFrente(pm, spec, u) {
  const ac = spec.acessorios || [];
  const escuro = ac.includes("oculosEscuros");
  if (!escuro && !ac.includes("oculos")) return;
  const aro = rgb(spec.aroOculos || (escuro ? "#2a2028" : "#c9ced8"));
  const lente = rgb(spec.lenteOculos || (escuro ? "#1e1418" : "#a9c4dc"));
  for (const ex of [5, 10]) {
    if (escuro) {
      pm.rect(ex - 1, 5 + u, 3, 2, lente);
      pm.set(ex - 1, 5 + u, clarear(lente, 0.45));
    } else {
      pm.set(ex - 1, 5 + u, aro);
      pm.set(ex + 1, 5 + u, aro);
      pm.set(ex - 1, 6 + u, aro);
      pm.set(ex + 1, 6 + u, aro);
      pm.set(ex, 5 + u, lente);
    }
  }
  pm.set(7, 5 + u, aro);
  pm.set(8, 5 + u, aro);
}

function oculosLado(pm, spec, u) {
  const ac = spec.acessorios || [];
  const escuro = ac.includes("oculosEscuros");
  if (!escuro && !ac.includes("oculos")) return;
  const aro = rgb(spec.aroOculos || (escuro ? "#2a2028" : "#c9ced8"));
  const lente = rgb(spec.lenteOculos || (escuro ? "#1e1418" : "#a9c4dc"));
  pm.set(8, 5 + u, aro);
  pm.set(9, 5 + u, aro);
  if (escuro) {
    pm.rect(10, 5 + u, 2, 2, lente);
    pm.set(11, 5 + u, clarear(lente, 0.45));
  } else {
    pm.set(10, 5 + u, lente);
    pm.set(11, 5 + u, aro);
    pm.set(11, 6 + u, aro);
  }
}

function acessoriosFrente(pm, P, spec, ps, costas) {
  const u = ps.bob;
  const ac = spec.acessorios || [];
  if (ac.includes("mochila")) {
    const bolsa = rgb("#6b4a2b");
    const bolsaS = escurecer(bolsa, 0.3);
    if (costas) {
      pm.rect(5, 11 + u, 6, 5, bolsa);
      pm.rect(5, 11 + u, 6, 1, bolsaS);
      pm.rect(10, 12 + u, 1, 4, bolsaS);
      pm.rect(6, 13 + u, 4, 1, bolsaS);
      pm.set(7, 14 + u, rgb("#c8a050"));
    } else {
      pm.rect(5, 11 + u, 1, 3, bolsaS);
      pm.rect(10, 11 + u, 1, 3, bolsaS);
    }
  }
  if (ac.includes("lanterna") && !costas && !ps.gesto) {
    const y = 17 + u + ps.bracoD;
    pm.set(13, y, rgb("#8a8f99"));
    pm.set(13, y + 1, rgb("#5a5f69"));
    pm.set(12, y + 1, rgb("#ffe9a0"));
  }
  if (ac.includes("cantaro")) {
    const barro = rgb("#b5653a");
    const bS = escurecer(barro, 0.3);
    const bL = clarear(barro, 0.2);
    const x0 = costas ? 1 : 12;
    pm.elipse(x0 + 1.5, 15 + u, 2.2, 2.6, (x, y, nx) => (nx > 0.3 ? bS : nx < -0.4 ? bL : barro));
    pm.rect(x0 + 1, 11 + u, 2, 2, barro);
    pm.set(x0 + 1, 11 + u, bL);
  }
  if (ac.includes("jarro") && !costas) {
    const barro = rgb("#a86b48");
    pm.rect(13, 15 + u + ps.bracoD, 3, 3, barro);
    pm.set(15, 16 + u + ps.bracoD, escurecer(barro, 0.3));
    pm.set(13, 15 + u + ps.bracoD, clarear(barro, 0.2));
  }
  if (ac.includes("maca")) {
    const palha = rgb("#b89a5e");
    pm.rect(costas ? 1 : 11, 12 + u, 5, 2, palha);
    pm.rect(costas ? 1 : 11, 14 + u, 5, 1, escurecer(palha, 0.3));
  }
}

// ---------- Vista de lado (virado para a direita) ----------
function pernasLado(pm, P, spec, ps) {
  const u = ps.bob;
  const quadris = 17 + u;
  // [quadrilX, péX, péY] para perna de trás (t) e da frente (f)
  const POSES = {
    "-1": { t: [6, 6, 22], f: [7, 7, 22] },
    0: { t: [6, 4, 22], f: [8, 10, 22] },
    1: { t: [6, 6, 20], f: [7, 7, 22] },
    2: { t: [7, 10, 22], f: [7, 4, 22] },
    3: { t: [6, 6, 22], f: [7, 7, 20] },
  };
  const pose = POSES[ps.passo];
  if (ehRoupao(spec)) {
    for (const [lado, [, px, py]] of [["t", pose.t], ["f", pose.f]]) {
      const pele = lado === "t" ? P.peleSombra : P.pele;
      pm.rect(px, py, 3, 1, pele);
      pm.rect(px, py + 1, 3, 1, lado === "t" ? P.sapatoSombra : P.sapato);
    }
    return;
  }
  for (const [lado, [hx, px, py]] of [["t", pose.t], ["f", pose.f]]) {
    const cor = lado === "t" ? P.calcaSombra : P.calca;
    const corS = lado === "t" ? escurecer(P.calcaSombra, 0.15) : P.calcaSombra;
    const passos = Math.max(1, py - 1 - quadris);
    for (let k = 0; k <= passos; k++) {
      const y = quadris + k;
      const x = Math.round(hx + ((px - hx) * k) / passos);
      pm.set(x, y, cor);
      pm.set(x + 1, y, corS);
    }
    const sap = lado === "t" ? P.sapatoSombra : P.sapato;
    pm.rect(px, py, 4, 1, sap);
    pm.rect(px, py + 1, 4, 1, lado === "t" ? escurecer(P.sapatoSombra, 0.2) : P.sapatoSombra);
    if (lado === "f") pm.set(px + 3, py, P.sapatoLuz);
  }
}

function troncoLado(pm, P, spec, ps) {
  const u = ps.bob;
  const fim = ehRoupao(spec) ? 21 : 16 + u;
  for (let y = 11 + u; y <= fim; y++) {
    let x0 = 5;
    let x1 = 10;
    if (ehRoupao(spec) && y >= 19) {
      x0 = 4 - (ps.passo === 0 || ps.passo === 2 ? 1 : 0);
      x1 = 11 + (ps.passo === 0 || ps.passo === 2 ? 1 : 0);
    }
    for (let x = x0; x <= x1; x++) {
      let c = P.top;
      if (x === x0) c = P.topSombra;
      if (x === x1) c = P.topLuz;
      if (y === 11 + u && (x === x0 || x === x1)) continue;
      pm.set(x, y, c);
    }
  }
  if (ehRoupao(spec)) {
    pm.rect(5, 15 + u, 6, 1, P.x);
    pm.set(5, 15 + u, P.acentoSombra);
  } else {
    pm.rect(5, 16 + u, 6, 1, P.topSombra);
  }
  pm.rect(7, 10 + u, 2, 1, P.peleSombra);
}

function cabecaLado(pm, P, spec, ps) {
  const u = ps.bob;
  const linhas = [
    [1, 6, 10],
    [2, 5, 11],
    [3, 4, 12],
    [4, 4, 12],
    [5, 4, 12],
    [6, 4, 12],
    [7, 4, 12],
    [8, 5, 12],
    [9, 6, 11],
  ];
  for (const [y, x0, x1] of linhas) {
    for (let x = x0; x <= x1; x++) {
      let c = P.pele;
      if (y === 9 || x <= 5) c = P.peleSombra;
      pm.set(x, y + u, c);
    }
  }
  pm.set(13, 6 + u, P.pele); // nariz
  pm.set(11, 3 + u, P.peleLuz);
  pm.set(10, 5 + u, P.olho);
  pm.set(10, 6 + u, P.olho);
  pm.set(11, 7 + u, P.bochecha);
  pm.set(12, 8 + u, P.boca);
}

function bracoLado(pm, P, spec, ps) {
  const u = ps.bob;
  const ombro = [7, 12 + u];
  let mao;
  if (ps.gesto) mao = [12, 13 + u];
  else if (ps.passo === 0) mao = [5, 16 + u];
  else if (ps.passo === 2) mao = [10, 16 + u];
  else mao = [7, 17 + u];
  const passos = 5;
  const manga = spec.mangaLonga || ehRoupao(spec) ? 4 : 3;
  for (let k = 0; k <= passos; k++) {
    const x = Math.round(ombro[0] + ((mao[0] - ombro[0]) * k) / passos);
    const y = Math.round(ombro[1] + ((mao[1] - ombro[1]) * k) / passos);
    const naManga = k < manga;
    pm.set(x, y, naManga ? P.top : P.pele);
    pm.set(x + 1, y, naManga ? P.topSombra : P.peleSombra);
  }
  return mao;
}

function mantoLado(pm, P, spec, ps) {
  if (!spec.manto) return;
  const u = ps.bob;
  for (let y = 11 + u; y <= 20; y++) {
    for (let x = 4; x <= 7; x++) {
      let c = x === 4 ? P.mantoSombra : x === 7 ? P.mantoLuz : P.manto;
      if ((x + y) % 5 === 0) c = escurecer(P.manto, 0.15);
      pm.set(x, y, c);
    }
  }
}

function desenharLado(pm, P, spec, ps) {
  const u = ps.bob;
  const estilo = CABELO[spec.estilo];
  const ac = spec.acessorios || [];
  if (ac.includes("mochila")) {
    const bolsa = rgb("#6b4a2b");
    pm.rect(3, 11 + u, 3, 5, bolsa);
    pm.rect(3, 11 + u, 1, 5, escurecer(bolsa, 0.3));
    pm.set(4, 13 + u, rgb("#c8a050"));
  }
  pernasLado(pm, P, spec, ps);
  troncoLado(pm, P, spec, ps);
  mantoLado(pm, P, spec, ps);
  cabecaLado(pm, P, spec, ps);
  if (spec.barba) pm.mascara(tipoBarba(spec).dir.map((l) => l || ""), { h: P.h, H: P.H }, 0, u);
  if (estilo) pm.mascara(estilo.dir, P, 0, u);
  if (spec.cobertura && COBERTURA[spec.cobertura]) pm.mascara(COBERTURA[spec.cobertura].dir, P, 0, u);
  // Orelha (cabelos curtos e sem cobertura)
  if (!spec.cobertura && ["curto", "raspado", "rabo", "cachosCurtos"].includes(spec.estilo)) {
    pm.set(7, 5 + u, P.peleSombra);
    pm.set(7, 6 + u, P.pele);
  }
  oculosLado(pm, spec, u);
  const mao = bracoLado(pm, P, spec, ps);
  if (ac.includes("lanterna") && !ps.gesto) {
    pm.set(mao[0] + 2, mao[1], rgb("#8a8f99"));
    pm.set(mao[0] + 3, mao[1], rgb("#ffe9a0"));
  }
  if (ac.includes("cantaro")) {
    const barro = rgb("#b5653a");
    pm.elipse(11.5, 15 + u, 2.3, 2.6, (x, y, nx) => (nx > 0.3 ? escurecer(barro, 0.3) : nx < -0.4 ? clarear(barro, 0.2) : barro));
    pm.rect(11, 11 + u, 2, 2, barro);
  }
  if (ac.includes("maca")) {
    const palha = rgb("#b89a5e");
    pm.rect(6, 12 + u, 6, 2, palha);
    pm.rect(6, 14 + u, 6, 1, escurecer(palha, 0.3));
    pm.set(11, 12 + u, clarear(palha, 0.2));
  }
  if (ac.includes("jarro")) {
    const barro = rgb("#a86b48");
    pm.rect(mao[0] + 1, mao[1] - 1, 3, 3, barro);
    pm.set(mao[0] + 3, mao[1], escurecer(barro, 0.3));
  }
}

// ---------- Montagem ----------
function quadro(spec, dir, anim, i) {
  const P = paleta(spec);
  const ps = pose(anim, i);
  let pm = new Pixmap(LARG, ALT);
  if (dir === "baixo") desenharFrente(pm, P, spec, ps, false);
  else if (dir === "cima") desenharFrente(pm, P, spec, ps, true);
  else desenharLado(pm, P, spec, ps);
  pm.contorno(0.66);
  if (dir === "esq") pm = pm.espelhado();
  return pm;
}

// Gera a folha completa: 7 colunas x 4 linhas (baixo, esq, dir, cima).
export function gerarFolha(spec) {
  const folha = criarCanvas(LARG * 7, ALT * 4);
  const ctx = folha.getContext("2d");
  DIRECOES.forEach((dir, linha) => {
    const anims = [
      ["parado", 0],
      ["parado", 1],
      ["andar", 0],
      ["andar", 1],
      ["andar", 2],
      ["andar", 3],
      ["gesto", 0],
    ];
    anims.forEach(([anim, i], col) => {
      ctx.drawImage(quadro(spec, dir, anim, i).paraCanvas(), col * LARG, linha * ALT);
    });
  });
  return folha;
}

// Personagem deitado numa maca (o homem enfermo de Betesda): 26x14.
export function gerarDeitado(spec) {
  const P = paleta(spec);
  const pm = new Pixmap(28, 14);
  const palha = rgb("#b89a5e");
  // Maca
  pm.rect(1, 6, 26, 6, palha);
  for (let x = 1; x < 27; x += 2) pm.set(x, 7 + (x % 4 === 1 ? 1 : 0), escurecer(palha, 0.15));
  pm.rect(1, 11, 26, 1, escurecer(palha, 0.32));
  pm.rect(1, 6, 26, 1, clarear(palha, 0.18));
  // Corpo coberto por um manto
  for (let x = 9; x <= 24; x++) {
    const alto = x < 21 ? 4 : 3;
    for (let y = 8 - alto + 1; y <= 9; y++) {
      pm.set(x, y, y === 9 ? P.topSombra : y === 8 - alto + 1 ? P.topLuz : P.top);
    }
  }
  pm.rect(24, 6, 2, 3, P.sapato); // pés
  // Cabeça
  pm.elipse(6.5, 6, 3.6, 3.2, (x, y, nx, ny) => (ny > 0.4 ? P.peleSombra : P.pele));
  pm.set(7, 5, P.olho);
  pm.set(5, 5, P.olho);
  pm.rect(3, 3, 7, 2, P.h);
  pm.rect(3, 5, 1, 3, P.H);
  if (spec.barba) {
    pm.rect(4, 8, 5, 1, P.h);
    pm.rect(5, 9, 3, 1, P.H);
  }
  pm.contorno(0.66);
  return pm.paraCanvas();
}

// Retrato a partir do sprite (para personagens sem foto): busto ampliado.
export function gerarRetratoSprite(folha, brilho = false) {
  const c = criarCanvas(96, 96);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const g = ctx.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, brilho ? "#5a4a2a" : "#2a2440");
  g.addColorStop(1, brilho ? "#2a1e10" : "#141022");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  if (brilho) {
    const r = ctx.createRadialGradient(48, 34, 4, 48, 34, 46);
    r.addColorStop(0, "rgba(255,236,170,0.55)");
    r.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, 96, 96);
  }
  // Recorta cabeça e tronco do quadro "parado, de frente" e amplia 6x.
  ctx.drawImage(folha, 0, 0, 16, 16, 0, 4, 96, 96);
  return c;
}
