// Sala 3 — O Tanque de Betesda (João 5:1–13).
// Jerusalém, à noite: dois tanques cercados por cinco pavilhões, colunas
// úmidas, braseiros e névoa. Aqui se resolve o enigma final.
import { DIALOGOS } from "../dados/dialogos.js";
import * as A from "../arte/objetos.js";
import { SIMBOLOS, desenharSimbolo, textoPixel } from "../arte/simbolos.js";
import {
  px,
  paleta,
  Mapa,
  objeto,
  npc,
  deitado,
  braseiro,
  marca,
  ampliar,
  imagemChave,
  animar,
  suave,
  ambiente,
  brilhos,
  conversa,
  exame,
  falarComGestos,
  desenharNevoa,
} from "./comum.js";

const D = DIALOGOS.betesda;
const ORDEM = ["talha", "gota", "maca"];

let J = null;
let R = {};

// ---------- Mapa ----------
function mapa() {
  const m = new Mapa(38, 26, ".");
  m.ret("P", 0, 1, 38, 3); // muralha do fundo
  m.ret("l", 9, 8, 20, 9); // pedras molhadas em volta dos tanques
  m.ret("w", 10, 9, 8, 7).ret("w", 20, 9, 8, 7); // os dois tanques
  m.ret("M", 0, 0, 38, 1).ret("M", 0, 0, 1, 26).ret("M", 37, 0, 1, 26).ret("M", 0, 25, 38, 1);
  m.ret(" ", 18, 25, 2, 1); // Porta das Ovelhas
  return m.linhas();
}

const TANQUES = [
  { x: 10, y: 9, w: 8, h: 7 },
  { x: 20, y: 9, w: 8, h: 7 },
];

// Profundidade da água: mais escura longe das bordas.
function profundidade(x, y) {
  const tx = x / 16;
  const ty = y / 16;
  const t = tx < 19 ? TANQUES[0] : TANQUES[1];
  const d = Math.min(tx - t.x, t.x + t.w - tx, ty - t.y, t.y + t.h - ty);
  return Math.max(0, Math.min(1, d / 2.6));
}

// As cinco colunas, uma em cada pavilhão, com o símbolo que cada uma esconde.
const COLUNAS = [
  { id: "norte", simbolo: "estrela", x: 13.5, y: 6.8 },
  { id: "oeste", simbolo: "talha", x: 7.6, y: 12.6 },
  { id: "meio", simbolo: "peixe", x: 19, y: 12.6 },
  { id: "leste", simbolo: "gota", x: 30.4, y: 12.6 },
  { id: "sul", simbolo: "maca", x: 24.5, y: 18.4 },
];

const BRASEIROS = [
  [4.6, 6.4],
  [33.4, 6.4],
  [4.6, 20.2],
  [33.4, 20.2],
  [15.4, 22.2],
  [22.6, 22.2],
];

const def = {
  larg: 38,
  alt: 26,
  mapa: mapa(),
  legenda: { M: "muro", P: "parede", ".": "pedra", l: "ladrilho", w: "agua", " ": "vazio" },
  paleta: paleta({
    ladrilho: "#7e7c78",
    ladrilho2: "#6c6a68",
    ladrilhoRejunte: "#36343e",
    pedra: "#8e8a84",
    pedra2: "#7a766f",
    rejunte: "#47434c",
    celula: 13,
    musgo: "#56664a",
    agua: "#22506c",
    aguaFunda: "#0c2032",
    profundidade,
    argamassa: "#3a3640",
    bloco: "#7a746c",
    bloco2: "#6a645e",
    topo: "#8a847c",
    topo2: "#7a746e",
    terra: "#6a5a48",
    terra2: "#5a4a3a",
    grama: "#4a6a3a",
    grama2: "#3e5a32",
    reboco: "#a89c88",
    reboco2: "#988c78",
    tijolo: "#7a4a36",
    rocha: "#6a6058",
    rocha2: "#5a524a",
    rochaTopo: "#7a7068",
  }),
  aguas: TANQUES.map((t) => ({ ...t, cores: { claro: "rgba(160,206,240,0.5)", medio: "rgba(96,146,196,0.32)" } })),
  decalques: [
    { tipo: "poca", x: 8.2, y: 16.6, w: 1.4, h: 0.5 },
    { tipo: "poca", x: 28.6, y: 8.2, w: 1.2, h: 0.5 },
    { tipo: "poca", x: 17.2, y: 17.4, w: 1, h: 0.4 },
    { tipo: "poca", x: 22.8, y: 7.4, w: 1.3, h: 0.5 },
    { tipo: "rachadura", x: 5, y: 9, n: 14 },
    { tipo: "rachadura", x: 30, y: 21, n: 12 },
    { tipo: "rachadura", x: 12, y: 2.6, n: 10 },
    { tipo: "degraus", x: 17, y: 23.4, w: 4, h: 1.6 },
    { tipo: "palha", x: 26.6, y: 16.9, w: 2, h: 1, n: 10 },
  ],
  inicio: { x: 19, y: 23.4, dir: "cima" },
  escuridao: 0.9,
  lanterna: "normal",
  musica: "betesda",
  tensao: 0.15,
  somPassos: { ladrilho: "molhado" },
};

// ---------- Montagem ----------
function montar(jogo, m) {
  J = jogo;
  R = { seq: [], colunas: [], braseiros: [] };

  for (const [x, y] of BRASEIROS) R.braseiros.push(braseiro(m, px(x), px(y), { raio: 98 }));
  // Brilho frio da água
  m.luzes.push({ x: px(19), y: px(12.4), raio: 150, cor: [70, 130, 210], brilho: 0.14, intensidade: 0.22 });

  // Colunas do enigma
  for (const c of COLUNAS) {
    const icone = desenharSimbolo(c.simbolo, "#e6d4ff", "#8a4aff");
    const col = objeto(m, A.coluna(false), px(c.x), px(c.y), {
      solido: { w: 16, h: 7 },
      aoDesenhar: (ctx, sx, sy, jogo, e) => {
        if (!e.revelada && !e.aceso) return;
        ctx.globalAlpha = e.aceso ? 1 : 0.4;
        ctx.drawImage(icone, Math.round(sx - icone.width / 2), Math.round(sy - 36 - icone.height / 2));
        ctx.globalAlpha = 1;
      },
      interacao: {
        get rotulo() {
          return col.revelada ? "Tocar o símbolo" : "Examinar a coluna";
        },
        get icone() {
          return col.revelada ? "usar" : "examinar";
        },
        raio: 20,
        acao: (jogo) => colunaAcao(jogo, col),
      },
    });
    col.simbolo = c.simbolo;
    col.revelada = false;
    col.aceso = false;
    col.luz = { x: px(c.x), y: px(c.y) - 36, raio: 56, cor: [160, 90, 255], brilho: 0.45, intensidade: 0.6, ativa: false };
    m.luzes.push(col.luz);
    R.colunas.push(col);
    marca(m, desenharSimbolo(c.simbolo), px(c.x), px(c.y) - 36, {
      ativa: (j) => j.flag("bet.curado"),
      aoRevelar: async (j) => {
        col.revelada = true;
        j.audio.sfx("revelar");
        j.ui.aviso(`Símbolo na coluna: <b>${SIMBOLOS[c.simbolo].nome}</b>`, c.simbolo);
      },
    });
  }
  // Colunas de decoração (uma delas quebrada)
  objeto(m, A.coluna(false), px(24.5), px(6.8), { solido: { w: 16, h: 7 } });
  objeto(m, A.coluna(true), px(7.4), px(23.4), { solido: { w: 16, h: 7 } });
  objeto(m, A.coluna(true), px(32), px(22.6), { solido: { w: 16, h: 7 } });

  // O homem doente há 38 anos, e Jesus (que chega depois)
  R.enfermo = deitado(m, "enfermo", px(11.2), px(17.2), { interacao: conversa("Conversar", enfermoAcao) });
  R.enfermo.alturaMarcador = 16;
  R.curado = npc(m, "enfermoCurado", px(11.2), px(17.1), { visivel: false, olharJogador: false, solido: null });
  R.jesus = npc(m, "jesus", px(19), px(25.6), { visivel: false, olharJogador: false, solido: null });

  // Outros doentes à espera
  deitado(m, "doente1", px(27.6), px(17.4), { interacao: conversa("Conversar", (j) => j.falar(D.doente)) });
  deitado(m, "doente2", px(7.2), px(9.4), { interacao: conversa("Conversar", (j) => j.falar(D.doente)) });
  npc(m, "doente2", px(32.4), px(9.2), {
    dir: "esq",
    interacao: conversa("Conversar", (j) => j.falar(j.flag("bet.curado") ? D.doente2 : D.doente2Antes)),
  });
  objeto(m, A.macaVazia(), px(26), px(7.4), { solido: { w: 24, h: 5 } });
  objeto(m, A.macaVazia(), px(9.6), px(21.8), { solido: { w: 24, h: 5 } });
  objeto(m, A.anfora("#8a5a3a"), px(2.2), px(4.8), { solido: { w: 9, h: 4 } });
  objeto(m, A.cantaro(), px(35.4), px(4.9), { solido: { w: 9, h: 4 } });
  objeto(m, A.barril(), px(35.6), px(23.6), { solido: { w: 12, h: 5 } });

  // Amigos
  R.thama = npc(m, "thama", px(16.2), px(22.8), { dir: "cima", interacao: conversa("Conversar", thamaAcao) });
  R.samuel = npc(m, "samuel", px(31.6), px(15.6), { dir: "esq", gesticula: true, interacao: conversa("Conversar", samuelAcao) });

  // ---------- Marcas da luz negra ----------
  marca(m, desenharSimbolo("maca"), px(11.2), px(17.2) - 3, {
    ativa: (j) => j.flag("bet.curado"),
    aoRevelar: async (j) => {
      await j.falar(D.achouMaca);
      j.simbolo("maca", "Maca");
      j.pista("betesda-maca", "No chão onde o homem ficou deitado por 38 anos: o símbolo de uma maca.", "Betesda");
      R.thama.olharPara(j.jogador.x, j.jogador.y);
      await j.falar(D.thamaDepois);
      j.objetivo(objetivoAtual(j));
    },
  });
  marca(m, textoPixel("SIGA OS SINAIS\nNA ORDEM EM QUE\nOS ENCONTROU"), px(19), px(16.6), {
    ativa: (j) => j.estado.simbolos.includes("maca"),
    aoRevelar: async (j) => {
      j.flag("bet.inscricao", true);
      j.pista("betesda-ordem", "Na borda do tanque: “Siga os sinais na ordem em que os encontrou.”", "Betesda");
      await j.falar(D.inscricaoTanque);
      j.objetivo(objetivoAtual(j));
    },
  });
  marca(m, ampliar(textoPixel("A INVESTIGAÇÃO\nAINDA NÃO TERMINOU"), 2), px(19), px(2.3), {
    ativa: (j) => j.flag("bet.colunas"),
    aoRevelar: (j) => cenaFinal(j),
  });
  marca(m, imagemChave(3), px(2.7), px(2.4), {
    aoRevelar: async (j) => {
      j.pista("chave3", "A terceira chave, na muralha do fundo, com o número 3. Três chaves... para abrir o quê?", "Betesda");
    },
  });
}

// ---------- Roteiro ----------
function objetivoAtual(j) {
  if (!j.flag("bet.curado")) return "Fale com o homem deitado perto do tanque.";
  if (!j.estado.simbolos.includes("maca")) return "Ilumine com a luz negra o lugar onde o homem estava deitado.";
  if (!j.flag("bet.colunas")) {
    return j.flag("bet.inscricao") ? "Toque os símbolos das colunas na ordem certa." : "Passe a luz negra nas colunas e na borda do tanque.";
  }
  return "Ilumine a parede do fundo com a luz negra.";
}

async function aoEntrar(jogo) {
  await jogo.ui.cartao("Capítulo III", "O Tanque de Betesda", "João 5:1–9", 2800);
  await jogo.falar(D.intro);
  R.thama.olharPara(jogo.jogador.x, jogo.jogador.y);
  await jogo.falar(D.thama);
  jogo.objetivo(objetivoAtual(jogo));
}

async function enfermoAcao(jogo) {
  if (jogo.flag("bet.curado")) return;
  await jogo.falar(D.enfermoAntes);
  await cenaCura(jogo);
}

// Jesus cura o homem doente havia 38 anos (João 5:5–9).
async function cenaCura(jogo) {
  const { jesus, enfermo, curado } = R;
  const j = jogo.jogador;
  jogo.focar(px(12.6), px(18.4));
  await j.andarAte(px(9.4), px(19.8));
  j.olharPara(enfermo.x, enfermo.y);
  j.angulo = -0.9;
  jesus.visivel = true;
  jesus.parado = true;
  await jesus.seguirCaminho([[px(19), px(23.2)], [px(15.6), px(20.4)], [px(13.4), px(17.9)]], 36);
  jesus.olharPara(enfermo.x, enfermo.y);
  await jogo.esperar(0.6);
  await falarComGestos(jogo, D.cura, { jesus });

  // A cura
  jesus.gesticular(2.6);
  jogo.audio.sfx("cura");
  const luz = { x: enfermo.x, y: enfermo.y - 6, raio: 10, cor: [255, 236, 190], brilho: 0.55, intensidade: 0.95 };
  jogo.mundo.luzes.push(luz);
  await animar(1.8, (k) => {
    luz.raio = 10 + suave(k) * 90;
    if (Math.random() < 0.6) brilhos(jogo, enfermo.x, enfermo.y - 4, 1, "#fff0c0", 26);
  });
  jogo.piscar([255, 240, 200], 0.8, 0.32);
  jogo.vibrar([30, 50, 30]);
  enfermo.visivel = false;
  curado.visivel = true;
  curado.parado = true;
  curado.dir = "dir";
  brilhos(jogo, curado.x, curado.y - 12, 24, "#fff0c0", 18);
  await animar(1.2, (k) => {
    luz.raio = 100 - suave(k) * 90;
    luz.brilho = 0.55 * (1 - k);
  });
  jogo.mundo.luzes.splice(jogo.mundo.luzes.indexOf(luz), 1);
  curado.gesticular(1.6);
  await falarComGestos(jogo, D.curado, { enfermoCurado: curado });

  // Ele sai carregando a maca; Jesus se retira no meio da multidão.
  const sai = curado.seguirCaminho([[px(13), px(20.6)], [px(17.8), px(21)], [px(19.4), px(23.6)], [px(19.4), px(25.8)]], 46);
  await jogo.esperar(0.9);
  const retira = jesus.seguirCaminho([[px(17.6), px(20.8)], [px(19.6), px(23.4)], [px(19.6), px(25.8)]], 34);
  await Promise.all([sai, retira]);
  curado.visivel = false;
  jesus.visivel = false;
  await jogo.falar(D.retirou);
  jogo.focar(null);
  jogo.flag("bet.curado", true);
  R.thama.olharPara(j.x, j.y);
  await jogo.falar(D.thamaMaca);
  jogo.objetivo(objetivoAtual(jogo));
}

async function colunaAcao(jogo, col) {
  if (jogo.flag("bet.colunas")) return;
  if (!col.revelada) return jogo.falar(D.colunaSemPista);
  if (!jogo.estado.simbolos.includes("maca")) return jogo.falar(D.colunaCedo);
  if (col.aceso) return;
  R.seq.push(col.simbolo);
  const i = R.seq.length - 1;
  col.aceso = true;
  col.luz.ativa = true;
  jogo.audio.sfx("coluna", { ordem: i });
  jogo.vibrar(15);
  brilhos(jogo, col.x, col.y - 36, 10, "#d8b8ff", 12);
  if (R.seq[i] !== ORDEM[i]) {
    await jogo.esperar(0.7);
    jogo.audio.sfx("erro");
    for (const c of R.colunas) {
      c.aceso = false;
      c.luz.ativa = false;
    }
    R.seq = [];
    await jogo.falar(D.errou);
    return;
  }
  if (R.seq.length === ORDEM.length) await cenaMecanismo(jogo);
}

// As três colunas certas acendem e algo se move atrás da muralha.
async function cenaMecanismo(jogo) {
  jogo.flag("bet.colunas", true);
  await jogo.esperar(0.5);
  jogo.audio.sfx("mecanismo");
  jogo.tremer(1.5, 2.3);
  jogo.vibrar([60, 80, 60, 80, 120]);
  jogo.focar(px(19), px(5));
  const luz = { x: px(19), y: px(2.6), raio: 16, cor: [150, 80, 255], brilho: 0.5, intensidade: 0.45 };
  jogo.mundo.luzes.push(luz);
  R.luzParede = luz;
  await animar(2.4, (k) => {
    luz.raio = 16 + suave(k) * 110;
  });
  jogo.tensaoExtra = 0.3;
  await jogo.esperar(0.4);
  jogo.focar(null);
  R.thama.olharPara(px(19), px(2));
  await jogo.falar(D.thamaFinal);
  jogo.objetivo(objetivoAtual(jogo));
}

// A mensagem escondida: o ambiente escurece, a música cresce e vem o final.
async function cenaFinal(jogo) {
  jogo.objetivo("");
  jogo.focar(px(19), px(4));
  await jogo.esperar(1.2);
  await jogo.falar(D.paredeFinal);
  jogo.escuridaoAlvo = 0.97;
  jogo.tensaoExtra = 0.6;
  jogo.audio.sfx("final");
  jogo.piscar([140, 80, 255], 1.4, 0.3);
  const raios = R.braseiros.map((b) => b.luz.raio);
  await animar(3, (k) => {
    R.braseiros.forEach((b, i) => (b.luz.raio = raios[i] * (1 - 0.65 * suave(k))));
    if (R.luzParede) R.luzParede.raio = 126 + suave(k) * 40;
  });
  await jogo.esperar(0.8);
  await jogo.ui.fade(true, 1400);
  jogo.finalizar();
  await jogo.ui.fade(false, 900);
}

async function thamaAcao(jogo) {
  if (!jogo.flag("bet.curado")) return jogo.falar(D.thama);
  if (!jogo.estado.simbolos.includes("maca")) return jogo.falar(D.thamaMaca);
  if (!jogo.flag("bet.colunas")) return jogo.falar(D.thamaDepois);
  return jogo.falar(D.thamaFinal);
}

async function samuelAcao(jogo) {
  if (jogo.flag("bet.colunas")) return jogo.falar(D.samuelFim);
  if (jogo.estado.simbolos.includes("maca")) return jogo.falar(D.samuelDepois);
  return jogo.falar(D.samuel);
}

function atualizar(jogo, dt) {
  ambiente(jogo, dt, {
    vagalumes: [
      { x: px(1), y: px(5), w: px(8), h: px(19), taxa: 0.5 },
      { x: px(29), y: px(5), w: px(8), h: px(19), taxa: 0.5 },
    ],
    brilhosAgua: TANQUES.map((t) => ({ x: px(t.x), y: px(t.y), w: px(t.w), h: px(t.h), taxa: 1.6 })),
    poeiraFeixe: true,
  });
}

// Névoa baixa sobre a água.
function desenharPorCima(ctx, cx, cy, jogo) {
  desenharNevoa(ctx, cx, cy, { x: px(8), y: px(7.4), w: px(22), h: px(10.6) }, jogo.t, 0.1, 5);
}

export const betesda = { def, montar, aoEntrar, atualizar, desenharPorCima };
