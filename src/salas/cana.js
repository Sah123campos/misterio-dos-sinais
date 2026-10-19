// Sala 1 — As Bodas de Caná (João 2:1–11).
// Pátio de uma casa em festa ao entardecer: mesas, convidados e tochas; a
// cozinha com a cisterna e as seis talhas de pedra; e a adega escura.
import { DIALOGOS } from "../dados/dialogos.js";
import * as A from "../arte/objetos.js";
import { desenharSimbolo, textoPixel, setaPixel } from "../arte/simbolos.js";
import {
  px,
  paleta,
  Mapa,
  objeto,
  npc,
  tocha,
  lamparina,
  marca,
  imagemChave,
  jogadorCom,
  animar,
  suave,
  ambiente,
  brilhos,
  conversa,
  exame,
} from "./comum.js";

const D = DIALOGOS.cana;
const NUM_TALHAS = 6;
const ESCURIDAO = 0.36;

let J = null; // jogo (usado nos rótulos que mudam com o andamento)
let R = {}; // referências da sala montada

// ---------- Mapa ----------
function mapa() {
  const m = new Mapa(36, 24, "g");
  m.ret("M", 0, 0, 36, 1);
  m.ret("P", 1, 1, 9, 2); // parede do fundo da adega
  m.ret("M", 10, 1, 1, 9); // parede leste da adega
  m.ret("R", 11, 1, 24, 2); // parede rebocada da casa
  m.ret(",", 1, 3, 9, 6); // chão de terra da adega
  m.ret(".", 11, 3, 14, 15); // pátio da festa
  m.ret("l", 25, 3, 10, 10); // cozinha
  m.ret("M", 1, 9, 9, 1); // parede sul da adega
  m.ret("P", 1, 10, 10, 1);
  m.ret(",", 5, 9, 2, 2); // porta da adega
  m.ret(".", 5, 11, 2, 2).ret(".", 7, 12, 4, 1); // caminho até a adega
  m.ret(".", 16, 18, 4, 5); // caminho da entrada
  m.ret("M", 0, 0, 1, 24).ret("M", 35, 0, 1, 24);
  return m.linhas();
}

const MESAS = [
  [0, 14, 13],
  [2, 21, 13],
  [3, 14, 16.6],
  [1, 21, 16.6],
];

const def = {
  larg: 36,
  alt: 24,
  mapa: mapa(),
  legenda: { M: "muro", P: "parede", R: "reboco", ",": "terra", ".": "pedra", l: "ladrilho", g: "grama" },
  paleta: paleta({
    ladrilho: "#b46a42",
    ladrilho2: "#a25c3a",
    ladrilhoRejunte: "#5e3a28",
    pedra: "#bba27c",
    pedra2: "#a68c66",
    rejunte: "#6e5a44",
    celula: 11,
    terra: "#6e5038",
    terra2: "#5e422e",
    pedrinha: "#9a8466",
    grama: "#5f7f3a",
    grama2: "#4c6a2e",
    flores: ["#f0e070", "#f08aa0", "#f4f0e0"],
    madeira: "#7a5032",
    madeira2: "#6a4428",
    agua: "#2e5a7a",
    aguaFunda: "#1c3a56",
    argamassa: "#4a3c30",
    bloco: "#7e6c56",
    bloco2: "#6c5c4a",
    reboco: "#dcc6a0",
    reboco2: "#ccb288",
    tijolo: "#a8603e",
    topo: "#9a8466",
    topo2: "#8a7458",
    rocha: "#7a6e60",
    rocha2: "#6a5e52",
    rochaTopo: "#8a7e6e",
  }),
  decalques: [
    { tipo: "palha", x: 1, y: 3, w: 9, h: 6, n: 46 },
    { tipo: "tapete", x: 11.8, y: 4.9, w: 4.4, h: 2.8, cor: "#7a2234", cor2: "#d8a848", cor3: "#2e3a6a" },
    { tipo: "petalas", x: 11.5, y: 8, w: 13, h: 10, n: 80 },
    ...MESAS.map(([, x, y]) => ({ tipo: "sombra", x: x - 1.9, y: y - 0.7, w: 3.8, h: 1.4, forca: 0.42 })),
    { tipo: "folhas", x: 1, y: 13, w: 9, h: 9, n: 26 },
    { tipo: "folhas", x: 25, y: 13, w: 10, h: 9, n: 26 },
    { tipo: "poca", x: 30.1, y: 11.7, w: 1.3, h: 0.5 },
    { tipo: "rachadura", x: 13.2, y: 2.2, n: 12 },
  ],
  sombras: [{ x: 1, y: 1, w: 9.6, h: 10, forca: 0.95, borda: 22, fechada: true }],
  bloqueios: [{ x: 0, y: 23.2, w: 36, h: 0.8 }],
  inicio: { x: 18.2, y: 21.6, dir: "cima" },
  escuridao: ESCURIDAO,
  musica: "cana",
  tensao: 0,
};

// ---------- Montagem ----------
function montar(jogo, m) {
  J = jogo;
  R = { talhas: [], cheias: 0 };

  // Adega (escura, cheia de barris)
  const adega = [
    [A.barril(), 2, 4.4],
    [A.barril(), 3.1, 4.7],
    [A.anfora("#9a5a3a"), 4.5, 4.1],
    [A.anfora(), 5.3, 4.2],
    [A.caixote(), 7.6, 4.4],
    [A.caixote(), 8.7, 4.5],
    [A.saco(), 8.6, 6.2],
    [A.barril(), 8.5, 8.5],
    [A.saco(), 1.9, 8.3],
    [A.caixote(), 1.9, 6.7],
  ];
  for (const [arte, x, y] of adega) objeto(m, arte, px(x), px(y), { solido: { w: arte.img.width - 4, h: 5 } });
  R.kenedy = npc(m, "kenedy", px(5.6), px(6.6), { dir: "esq", interacao: conversa("Conversar", kenedyAcao) });
  marca(m, imagemChave(1), px(2.6), px(1.75), {
    aoRevelar: async (j) => {
      j.pista("chave1", "Uma pequena chave desenhada na parede da adega, com o número 1.", "Caná");
    },
  });

  // Portão norte
  R.portao = objeto(m, A.portao(false), px(18), px(3), {
    interacao: {
      get rotulo() {
        return J.flag("cana.inscricao") ? "Abrir a fechadura" : "Examinar o portão";
      },
      icone: "usar",
      raio: 26,
      acao: portaoAcao,
    },
  });
  R.portao.pontoInteracao = () => ({ x: px(18), y: px(3) + 6 });
  R.portao.alturaMarcador = 36;
  objeto(m, A.vasoPlanta(1), px(16), px(3.8), { solido: { w: 10, h: 4 } });
  objeto(m, A.vasoPlanta(0), px(20), px(3.8), { solido: { w: 10, h: 4 } });
  objeto(m, A.anfora(), px(12.7), px(3.8), { solido: { w: 9, h: 4 } });
  objeto(m, A.anfora("#a8603e"), px(23.2), px(3.8), { solido: { w: 9, h: 4 } });

  // Mesa dos noivos
  const yNoivos = px(7);
  objeto(m, A.mesa(1), px(14), yNoivos, { solido: { w: 48, h: 12 } });
  lamparina(m, px(14.4), yNoivos + 1, 11);
  R.noivo = npc(m, "noivo", px(13.2), px(6), {
    dir: "baixo",
    gesticula: true,
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.noivoDepois : D.noivo)),
  });
  R.noiva = npc(m, "noiva", px(14.9), px(6), {
    dir: "baixo",
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.noivaDepois : D.noiva)),
  });

  // Jesus, Maria e o mestre-sala
  R.jesus = npc(m, "jesus", px(17.6), px(8.6), {
    dir: "baixo",
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.jesusDepois : D.jesusAntes)),
  });
  R.maria = npc(m, "maria", px(19.2), px(9), {
    dir: "esq",
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.mariaDepois : D.mariaAntes)),
  });
  R.mestre = npc(m, "mestre", px(22.4), px(6.6), {
    dir: "esq",
    gesticula: true,
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.mestreDepois : D.mestreAntes)),
  });

  // Mesas dos convidados
  for (const [v, x, y] of MESAS) {
    objeto(m, A.mesa(v), px(x), px(y), { solido: { w: 48, h: 12 } });
    lamparina(m, px(x) + (v % 2 ? -8 : 9), px(y) + 1, 11);
  }
  const convidados = [
    ["convidado1", 13, 12, () => D.convidado],
    ["convidada1", 15.2, 11.9, () => D.convidada],
    ["convidado2", 21.9, 12, () => D.convidado2],
    ["convidado3", 13.4, 15.7, () => D.convidado3],
    ["convidada2", 20.1, 15.7, () => (J.flag("cana.milagre") ? D.convidada2Depois : D.convidada2Antes)],
    ["convidada3", 22, 15.7, () => D.convidada3],
  ];
  for (const [id, x, y, falas] of convidados) {
    npc(m, id, px(x), px(y), { dir: "baixo", gesticula: id.startsWith("convidado"), interacao: conversa("Conversar", (j) => j.falar(falas())) });
  }

  // Tochas e guirlandas
  for (const [x, y] of [[11.7, 3.9], [24.3, 3.9], [11.7, 10.8], [24.3, 10.8], [11.7, 17.4], [24.3, 17.4], [34.3, 9]]) tocha(m, px(x), px(y));
  m.extrasFrente.push((ctx, cx, cy, t) => {
    A.desenharGuirlanda(ctx, px(11.7) - cx, px(3.9) - 31 - cy, px(24.3) - cx, px(3.9) - 31 - cy, 12, t);
  });

  // Cozinha: as seis talhas de pedra (João 2:6)
  for (let i = 0; i < NUM_TALHAS; i++) {
    const t = objeto(m, A.talha(), 420 + i * 22, 75, {
      solido: { w: 14, h: 6 },
      aoDesenhar: (ctx, sx, sy, jogo, e) => A.conteudoTalha(ctx, sx, sy, e.nivel, e.vinho, jogo.t + i),
      interacao: {
        get rotulo() {
          if (J.flag("cana.milagre")) return "Examinar talha";
          if (J.flag("cana.agua") && t.nivel < 1) return "Despejar a água";
          return "Examinar talha";
        },
        icone: "examinar",
        raio: 15,
        acao: (jogo) => talhaAcao(jogo, t),
      },
    });
    t.nivel = 0;
    t.vinho = 0;
    R.talhas.push(t);
  }
  R.cisterna = objeto(m, A.cisterna(), px(31.5), px(11.3), {
    solido: { w: 28, h: 8 },
    interacao: {
      get rotulo() {
        return J.flag("cana.ordem") && !J.flag("cana.cheias") && !J.flag("cana.agua") ? "Tirar água" : "Examinar cisterna";
      },
      icone: "usar",
      raio: 22,
      acao: cisternaAcao,
    },
  });
  R.servo = npc(m, "servo", px(26.8), px(10.2), { dir: "esq", gesticula: true, interacao: conversa("Conversar", servoAcao) });
  R.servo2 = npc(m, "servo2", px(29.4), px(11.5), {
    dir: "dir",
    interacao: conversa("Conversar", (j) => j.falar(j.flag("cana.milagre") ? D.servo2Depois : D.servo2Antes)),
  });
  objeto(m, A.barril(), px(34.2), px(12.3), { solido: { w: 12, h: 5 } });
  objeto(m, A.saco(), px(33.2), px(12.5), { solido: { w: 10, h: 4 } });
  objeto(m, A.caixote(), px(25.8), px(12.5), { solido: { w: 12, h: 5 } });
  objeto(m, A.anfora("#9a5a3a"), px(25.5), px(7.2), { solido: { w: 9, h: 4 } });

  // Jardim e entrada
  R.debora = npc(m, "debora", px(16.4), px(20.2), { dir: "dir", interacao: conversa("Conversar", deboraAcao) });
  objeto(m, A.palmeira(0), px(13), px(21.4), { solido: { w: 6, h: 4 } });
  objeto(m, A.palmeira(1), px(23), px(21.4), { solido: { w: 6, h: 4 } });
  objeto(m, A.vasoPlanta(1), px(15.3), px(18.6), { solido: { w: 10, h: 4 } });
  objeto(m, A.vasoPlanta(0), px(20.7), px(18.6), { solido: { w: 10, h: 4 } });
  for (const [x, y, v] of [[2.5, 14.5, 0], [6.5, 16.5, 2], [3, 20, 1], [8.5, 21.5, 0], [27, 15, 1], [31, 17, 2], [33.5, 21, 0], [28, 21.5, 2], [9.6, 17.6, 1]]) {
    objeto(m, A.arbusto(v), px(x), px(y), { solido: { w: 14, h: 5 } });
  }

  // Cerca viva no limite de baixo
  for (let x = 1.4; x < 35; x += 2.3) {
    if (x > 15 && x < 20.5) continue;
    objeto(m, A.arbusto(Math.round(x * 3) % 3), px(x), px(23.9), { solido: { w: 14, h: 5 } });
  }
  for (const x of [15.6, 20.4]) objeto(m, A.vasoPlanta(1), px(x), px(23.8), { solido: { w: 10, h: 4 } });

  // ---------- Marcas da luz negra ----------
  // Setas no chão: da adega até as talhas.
  for (const [x, y, a] of [[5.9, 11.4, 0.7], [9, 12.4, 0], [12.8, 9.8, -0.2], [16.2, 9.8, 0], [20.6, 9.8, 0], [25.4, 8.8, -0.35], [28.6, 7.4, -0.45], [31.4, 6.2, -0.55]]) {
    marca(m, setaPixel(a), px(x), px(y));
  }
  // O símbolo na sexta talha.
  marca(m, desenharSimbolo("talha"), 420 + 5 * 22, 63, {
    ativa: (j) => j.flag("cana.milagre"),
    aoRevelar: async (j) => {
      await j.falar(D.achouSimbolo);
      j.simbolo("talha", "Talha");
      j.pista("cana-talha", "A sexta talha guarda um símbolo escondido: uma talha.", "Caná");
      j.objetivo("Procure mais marcas com a luz negra perto do portão norte.");
    },
  });
  // A pergunta ao lado do portão.
  marca(m, textoPixel("QUANTAS TALHAS\nDE PEDRA?"), px(21.6), 27, {
    ativa: (j) => j.estado.simbolos.includes("talha"),
    aoRevelar: async (j) => {
      j.flag("cana.inscricao", true);
      j.pista("cana-portao", "Ao lado do portão norte: “Quantas talhas de pedra?”", "Caná");
      await j.falar(D.portaoInscricao);
      j.objetivo("Abra a fechadura do portão norte.");
    },
  });
  // Na parede da cozinha.
  marca(m, textoPixel("O PRIMEIRO\nDOS SINAIS"), 474, 27, {
    aoRevelar: async (j) => {
      await j.falar(D.primeiroSinal);
      j.pista("cana-sinal", "Na parede da cozinha: “O primeiro dos sinais”.", "Caná");
    },
  });
}

// ---------- Roteiro ----------
async function aoEntrar(jogo) {
  await jogo.ui.cartao("Capítulo I", "As Bodas de Caná", "João 2:1–11", 2800);
  await jogo.falar(D.intro);
  R.debora.olharPara(jogo.jogador.x, jogo.jogador.y);
  await jogo.falar(D.debora);
  jogo.objetivo("Descubra o que está acontecendo perto da cozinha.");
}

async function deboraAcao(jogo) {
  if (!jogo.flag("cana.ordem")) return jogo.falar(D.debora);
  if (!jogo.flag("cana.milagre")) return jogo.falar(D.deboraEnchendo);
  if (!jogo.estado.uvLiberada) return jogo.falar(D.deboraDepois);
  return jogo.falar(D.deboraFim);
}

async function servoAcao(jogo) {
  if (!jogo.flag("cana.ordem")) {
    await jogo.falar(D.servoAntes);
    await cenaOrdem(jogo);
  } else if (!jogo.flag("cana.milagre")) {
    await jogo.falar(jogo.flag("cana.agua") || R.cheias > 0 ? D.servoEnchendo : D.servoAgua);
  } else await jogo.falar(D.servoDepois);
}

// Maria percebe a falta de vinho e Jesus manda encher as talhas.
async function cenaOrdem(jogo) {
  const { jesus, maria, servo } = R;
  jogo.focar(px(19.6), px(8.6));
  await maria.andarAte(px(18.8), px(8.7), 30);
  maria.parado = true;
  jesus.parado = true;
  maria.olharPara(jesus.x, jesus.y);
  jesus.olharPara(maria.x, maria.y);
  await jogo.esperar(0.3);
  await jogo.falar(D.milagre1.slice(0, 2));
  // Maria chama os empregados.
  maria.olharPara(px(24), px(10));
  maria.gesticular(1.4);
  await servo.seguirCaminho([[px(24.8), px(10)], [px(21.2), px(9.7)]], 46);
  servo.parado = true;
  servo.olharPara(maria.x, maria.y);
  await jogo.falar(D.milagre1.slice(2, 4));
  jesus.olharPara(servo.x, servo.y);
  jesus.gesticular(1.6);
  await jogo.falar(D.milagre1.slice(4));
  servo.olharPara(jogo.jogador.x, jogo.jogador.y);
  await jogo.falar(D.servoAgua);
  jogo.focar(null);
  await servo.seguirCaminho([[px(24.8), px(10)], [px(26.8), px(10.2)]], 46);
  servo.parado = false;
  maria.parado = false;
  jesus.parado = false;
  jogo.flag("cana.ordem", true);
  jogo.objetivo("Pegue água na cisterna da cozinha e encha as seis talhas.");
}

function respingo(jogo, x, y, n = 10) {
  for (let i = 0; i < n; i++) {
    jogo.particulas.emitir({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -20 - Math.random() * 25,
      ay: 120,
      vida: 0.45 + Math.random() * 0.3,
      cor: "#a8d8f0",
      cor2: "#4f9ccc",
    });
  }
}

async function cisternaAcao(jogo) {
  if (!jogo.flag("cana.ordem")) return jogo.falar(D.cisternaSemOrdem);
  if (jogo.flag("cana.cheias")) return jogo.falar(D.cisternaDepois);
  if (jogo.flag("cana.agua")) return jogo.falar(D.cisternaCheia);
  jogo.jogador.olharPara(R.cisterna.x, R.cisterna.y);
  jogo.audio.sfx("balde");
  await jogo.esperar(0.35);
  jogo.audio.sfx("agua");
  respingo(jogo, R.cisterna.x, R.cisterna.y - 14);
  await jogo.esperar(0.4);
  jogadorCom(jogo, "jarro");
  jogo.flag("cana.agua", true);
  jogo.vibrar(12);
  jogo.ui.aviso("Você encheu um <b>cântaro</b> de água.");
  jogo.objetivo(`Despeje a água nas talhas de pedra (${R.cheias}/${NUM_TALHAS}).`);
}

async function talhaAcao(jogo, t) {
  if (jogo.flag("cana.milagre")) return jogo.falar(D.talhaVinho);
  if (!jogo.flag("cana.ordem")) return jogo.falar(D.talhaAntes);
  if (t.nivel >= 1) return jogo.falar(D.talhaCheia);
  if (!jogo.flag("cana.agua")) return jogo.falar(D.talhaSemAgua);
  const j = jogo.jogador;
  j.olharPara(t.x, t.y);
  j.angulo = -Math.PI / 2;
  jogo.audio.sfx("encher", { dur: 1.1 });
  await animar(1.1, (k) => {
    t.nivel = suave(k);
    if (Math.random() < 0.25) respingo(jogo, t.x, t.y - 21, 1);
  });
  t.nivel = 1;
  R.cheias++;
  jogo.vibrar(10);
  if (R.cheias < NUM_TALHAS) {
    jogo.objetivo(`Despeje a água nas talhas de pedra (${R.cheias}/${NUM_TALHAS}).`);
    return;
  }
  jogadorCom(jogo, null);
  jogo.flag("cana.agua", false);
  jogo.flag("cana.cheias", true);
  jogo.objetivo("");
  await cenaVinho(jogo);
}

// O primeiro sinal: a água se torna vinho. É um sinal de Jesus, não do jogador.
async function cenaVinho(jogo) {
  const { jesus, maria, servo, mestre, noivo } = R;
  await jogo.falar(D.cheias);
  jesus.parado = true;
  jogo.focar(px(27.6), px(6.2));
  // O jogador dá espaço para Jesus.
  const j = jogo.jogador;
  if (j.y < px(9.5) && j.x > px(25)) await j.andarAte(Math.min(Math.max(j.x, px(29.5)), px(33.8)), px(9.6));
  j.olharPara(px(28), px(4.5));
  await jesus.seguirCaminho([[px(19.6), px(9.9)], [px(24.6), px(9.6)], [px(27.6), px(7.3)]], 40);
  jesus.olharPara(px(27.6), px(4));
  await jogo.esperar(0.5);
  jesus.gesticular(3.2);
  await jogo.falar(D.milagre2);

  jogo.audio.sfx("transformacao");
  jogo.tensaoExtra = 0;
  const brilho = { x: 475, y: 62, raio: 12, cor: [255, 196, 150], brilho: 0.5, intensidade: 0.95 };
  jogo.mundo.luzes.push(brilho);
  await animar(2.8, (k) => {
    brilho.raio = 12 + suave(k) * 130;
    R.talhas.forEach((t, i) => {
      t.vinho = suave(Math.max(0, Math.min(1, k * 1.5 - i * 0.09)));
    });
    if (Math.random() < 0.6) {
      const t = R.talhas[Math.floor(Math.random() * NUM_TALHAS)];
      brilhos(jogo, t.x, t.y - 20, 1, Math.random() < 0.5 ? "#ffe0b0" : "#ffc0d0", 10);
    }
  });
  jogo.piscar([255, 210, 170], 1, 0.35);
  for (const t of R.talhas) brilhos(jogo, t.x, t.y - 20, 8, "#ffe9c0", 12);
  jogo.vibrar([30, 60, 30]);
  await animar(1.4, (k) => {
    brilho.raio = 142 - suave(k) * 130;
    brilho.brilho = 0.5 * (1 - k);
  });
  jogo.mundo.luzes.splice(jogo.mundo.luzes.indexOf(brilho), 1);

  // O servo leva o vinho ao mestre-sala.
  servo.parado = true;
  await servo.seguirCaminho([[px(28.4), px(8.4)], [px(28.4), px(6.4)]], 46);
  servo.olharPara(px(28.4), px(4));
  await jogo.esperar(0.6);
  jogo.audio.sfx("agua");
  const leva = servo.seguirCaminho([[px(26), px(8.6)], [px(23.6), px(7.2)]], 46);
  jogo.focar(px(22.4), px(6.8));
  await leva;
  servo.olharPara(mestre.x, mestre.y);
  mestre.parado = true;
  mestre.olharPara(servo.x, servo.y);
  await jogo.esperar(0.4);
  mestre.gesticular(1.2);
  await jogo.esperar(1);
  mestre.olharPara(noivo.x, noivo.y);
  noivo.parado = true;
  noivo.olharPara(mestre.x, mestre.y);
  mestre.gesticular(2);
  await jogo.falar(D.mestre);
  jogo.focar(px(19.5), px(7.6));
  await jogo.esperar(0.4);
  await jogo.falar(D.sinal);
  jogo.focar(null);

  // Cada um volta ao seu lugar.
  await Promise.all([
    servo.seguirCaminho([[px(25.6), px(9.8)], [px(26.8), px(10.2)]], 46),
    jesus.seguirCaminho([[px(24.6), px(9.6)], [px(19.6), px(9.9)], [px(17.6), px(8.6)]], 46),
  ]);
  for (const p of [servo, jesus, mestre, noivo, maria]) p.parado = false;
  jesus.dirPadrao = "baixo";
  jogo.flag("cana.milagre", true);

  // Débora viu algo na adega.
  R.debora.x = px(9.6);
  R.debora.y = px(13.4);
  R.debora.dirPadrao = "cima";
  R.debora.dir = "cima";
  await jogo.falar(D.deboraDepois);
  jogo.objetivo("Investigue o canto escuro da adega. Use a lanterna.");
  jogo.tensaoExtra = 0.08;
}

async function kenedyAcao(jogo) {
  if (!jogo.flag("cana.milagre")) return jogo.falar(D.kenedyAntes);
  if (jogo.estado.uvLiberada) return jogo.falar(D.kenedyDepois);
  await jogo.falar(D.kenedyUV);
  jogo.liberarUV();
  jogo.audio.sfx("uv");
  jogo.piscar([150, 80, 255], 0.6, 0.35);
  jogo.vibrar([20, 40, 20]);
  const como = jogo.entrada.dispositivo === "toque" ? "o botão roxo" : "a tecla <b>Q</b>";
  jogo.ui.aviso(`<b>Luz negra</b> recebida! Use ${como} para ligar.`);
  jogo.objetivo("Use a luz negra e siga as setas escondidas.");
  jogo.tensaoExtra = 0.15;
}

async function portaoAcao(jogo) {
  if (jogo.flag("cana.aberto")) return sair(jogo);
  if (!jogo.flag("cana.milagre")) return jogo.falar(D.portaoAntes);
  if (!jogo.flag("cana.inscricao")) return jogo.falar(D.portaoTrancado);
  const ok = await jogo.ui.enigmas.numero({
    titulo: "Fechadura do portão",
    texto: "Um mostrador de 1 a 9. A inscrição pergunta: quantas talhas de pedra havia na festa?",
    resposta: NUM_TALHAS,
    dicaErro: "Não abriu. Conte as talhas da cozinha.",
  });
  if (!ok) return;
  jogo.audio.sfx("fechadura");
  await jogo.esperar(0.6);
  jogo.audio.sfx("porta");
  jogo.tremer(1, 0.7);
  R.portao.img = A.portao(true).img;
  jogo.flag("cana.aberto", true);
  await jogo.esperar(0.8);
  await jogo.falar(D.portaoAberto);
  await sair(jogo);
}

async function sair(jogo) {
  const j = jogo.jogador;
  await j.andarAte(px(18), px(3) + 8);
  await j.andarAte(px(18), px(3) - 2);
  await jogo.carregarSala("poco");
}

function atualizar(jogo, dt) {
  ambiente(jogo, dt, {
    vagalumes: [
      { x: px(1), y: px(13), w: px(9), h: px(9), taxa: 0.8 },
      { x: px(25), y: px(13), w: px(10), h: px(9), taxa: 0.8 },
    ],
    petalas: [{ x: px(11), y: px(2), w: px(14), h: px(12), taxa: 0.35 }],
    poeiraFeixe: (j) => j.jogador.x < px(10.5) && j.jogador.y < px(10.5),
  });
}

export const cana = { def, montar, aoEntrar, atualizar };
