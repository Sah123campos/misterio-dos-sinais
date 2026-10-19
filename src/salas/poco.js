// Sala 2 — O Poço de Jacó (João 4:1–42).
// Meio-dia em Samaria: sol forte, oliveiras e o poço de pedra. No paredão,
// uma gruta escura guarda a porta de pedra que leva adiante.
import { DIALOGOS } from "../dados/dialogos.js";
import { ELENCO } from "../dados/elenco.js";
import * as A from "../arte/objetos.js";
import { gerarFolha } from "../arte/personagens.js";
import { criarCanvas } from "../arte/pixel.js";
import { desenharSimbolo, textoPixel, setaPixel } from "../arte/simbolos.js";
import { px, paleta, Mapa, objeto, npc, marca, imagemChave, animar, suave, ambiente, conversa, exame, falarComGestos } from "./comum.js";

const D = DIALOGOS.poco;

let J = null;
let R = {};

// ---------- Mapa ----------
function mapa() {
  const m = new Mapa(40, 26, "g");
  m.ret("K", 0, 0, 40, 2); // topo do paredão
  m.ret("r", 0, 2, 40, 2); // face do paredão
  // Gruta, no canto de cima à direita
  m.ret("K", 27, 2, 3, 8).ret("K", 37, 2, 3, 8);
  m.ret(".", 30, 4, 7, 6);
  m.ret("K", 27, 10, 13, 1).ret("r", 27, 11, 13, 1);
  m.ret(".", 32, 10, 3, 2); // entrada da gruta
  // Caminhos
  m.ret(",", 0, 14, 12, 3); // estrada que vem da cidade
  m.elipse(".", 14, 12, 4.4, 3.4); // calçada em volta do poço
  m.ret(",", 17, 12, 18, 2); // até a gruta
  m.ret(",", 19, 14, 3, 11); // até a entrada, ao sul
  m.elipse("a", 31, 20, 4.5, 2.6);
  m.elipse("a", 6, 21, 3.5, 2);
  // Bordas
  m.ret("K", 0, 4, 1, 22).ret(",", 0, 14, 1, 3);
  m.ret("K", 39, 0, 1, 26);
  return m.linhas();
}

const OLIVEIRAS = [
  [4.2, 7.4, 0],
  [8.5, 19.4, 1],
  [23.4, 7.6, 2],
  [26.2, 19.8, 0],
  [35.8, 16.8, 1],
  [2.8, 23.2, 2],
  [12.4, 5.2, 1],
];

const def = {
  larg: 40,
  alt: 26,
  mapa: mapa(),
  legenda: { K: "rochaTopo", r: "rocha", g: "grama", ",": "terra", ".": "pedra", a: "areia" },
  paleta: paleta({
    pedra: "#cdb892",
    pedra2: "#b8a27c",
    rejunte: "#806a50",
    celula: 10,
    terra: "#b48c5e",
    terra2: "#a07a50",
    pedrinha: "#d8c09a",
    areia: "#e0c898",
    areia2: "#d2b686",
    grama: "#82a04a",
    grama2: "#6c8c3e",
    flores: ["#f4e070", "#f4f0e0", "#e88aa8"],
    madeira: "#7a5032",
    madeira2: "#6a4428",
    agua: "#2e5a7a",
    aguaFunda: "#1c3a56",
    rocha: "#a68e70",
    rocha2: "#8e785e",
    rochaTopo: "#bca684",
    topo: "#bca684",
    topo2: "#ac9676",
    argamassa: "#5a4a3c",
    bloco: "#9a8466",
    bloco2: "#8a765a",
  }),
  decalques: [
    // Sombras projetadas pelo sol do meio-dia (luz vindo de cima, à esquerda)
    ...OLIVEIRAS.map(([x, y]) => ({ tipo: "sombra", x: x - 1.4, y: y - 1.5, w: 4.2, h: 2.6, forca: 0.5 })),
    { tipo: "sombra", x: 13, y: 11.6, w: 4.6, h: 2, forca: 0.48 },
    { tipo: "folhas", x: 2, y: 5, w: 6, h: 4, n: 18 },
    { tipo: "folhas", x: 21, y: 6, w: 6, h: 3, n: 14 },
    { tipo: "folhas", x: 24, y: 18, w: 5, h: 3, n: 14 },
    { tipo: "rachadura", x: 15.5, y: 14.2, n: 10 },
    { tipo: "rachadura", x: 11.2, y: 10, n: 8 },
  ],
  sombras: [{ x: 26.6, y: 1.4, w: 13.4, h: 11, forca: 0.96, borda: 26, fechada: true }],
  bloqueios: [{ x: 0, y: 25.2, w: 40, h: 0.8 }],
  inicio: { x: 20, y: 23.2, dir: "cima" },
  escuridao: 0,
  musica: "poco",
  tensao: 0,
  somPassos: { pedra: "pedra" },
};

// ---------- Montagem ----------
function montar(jogo, m) {
  J = jogo;
  R = {};

  // O poço de Jacó
  R.poco = objeto(m, A.poco(), px(14), px(12), {
    solido: { w: 40, h: 14 },
    interacao: exame("Olhar o poço", pocoAcao, { raio: 30 }),
  });
  R.poco.alturaMarcador = 40;
  R.poco.pontoInteracao = () => {
    // O ponto mais próximo da borda, para funcionar de qualquer lado.
    const j = J.jogador;
    const dx = j.x - px(14);
    const dy = j.y - px(12) + 6;
    const d = Math.hypot(dx, dy) || 1;
    return { x: px(14) + (dx / d) * 22, y: px(12) - 6 + (dy / d) * 12 };
  };
  objeto(m, A.anfora(), px(5.6), px(4.7), { solido: { w: 9, h: 4 } });
  objeto(m, A.anfora("#a8603e"), px(6.4), px(4.9), { solido: { w: 9, h: 4 } });
  objeto(m, A.anfora("#c07a4a"), px(17.8), px(10.2), { solido: { w: 9, h: 4 } });

  // Jesus sentado junto ao poço, e a samaritana (ainda fora de cena)
  R.jesus = npc(m, "jesus", px(16.8), px(12.4), { dir: "esq", interacao: conversa("Conversar", jesusAcao) });
  R.samaritana = npc(m, "samaritana", px(-1.5), px(15.2), { visivel: false, olharJogador: false, solido: null });
  R.cantaro = objeto(m, A.cantaro(), px(10.6), px(13.1), {
    visivel: false,
    solido: { w: 9, h: 4 },
    interacao: exame("Examinar o cântaro", (j) => j.falar(j.estado.simbolos.includes("gota") ? D.cantaroDepois : D.cantaroSemUV)),
  });

  // Amigos
  R.bea = npc(m, "bea", px(18.3), px(21.2), { dir: "dir", interacao: conversa("Conversar", beaAcao) });
  R.mj = npc(m, "mj", px(31.6), px(6.2), { dir: "dir", interacao: conversa("Conversar", mjAcao) });

  // Gruta: a porta de pedra e a passagem por trás dela
  R.abertura = objeto(m, { img: criarAbertura(), ax: 14, ay: 31 }, px(33.5), px(4), { visivel: false, profundidade: -1 });
  R.porta = objeto(m, A.portaPedra(), px(33.5), px(4), {
    interacao: {
      get rotulo() {
        const s = J.estado.simbolos;
        return s.includes("talha") && s.includes("gota") ? "Encaixar os símbolos" : "Examinar a porta";
      },
      icone: "usar",
      raio: 24,
      acao: portaAcao,
    },
  });
  R.porta.pontoInteracao = () => ({ x: px(33.5), y: px(4) + 6 });
  R.porta.alturaMarcador = 38;
  R.portaY = R.porta.y;
  objeto(m, A.rocha(1), px(30.8), px(9.4), { solido: { w: 14, h: 5 } });
  objeto(m, A.rocha(0), px(36.2), px(5), { solido: { w: 14, h: 5 } });

  // Vegetação
  for (const [x, y, v] of OLIVEIRAS) {
    objeto(m, A.troncoOliveira(v), px(x), px(y), { solido: { w: 8, h: 5 } });
    objeto(m, A.copaArvore(v, "oliveira"), px(x), px(y) - 16, { camada: "frente" });
  }
  objeto(m, A.palmeira(0), px(17.8), px(5.6), { solido: { w: 6, h: 4 } });
  objeto(m, A.palmeira(1), px(36.6), px(23.2), { solido: { w: 6, h: 4 } });
  for (const [x, y, v] of [[2.5, 12, 0], [7.4, 9.6, 1], [25.6, 15.6, 0], [37.4, 21.6, 1], [16.4, 24, 0], [28.6, 23.4, 1], [10.6, 23.6, 0]]) {
    objeto(m, A.rocha(v), px(x), px(y), { solido: { w: 14, h: 5 } });
  }
  for (const [x, y, v] of [[6, 5.4, 0], [10, 5.6, 2], [21.2, 5.2, 1], [3.4, 17.9, 2], [37.2, 13.6, 0], [13.6, 21.6, 1], [24, 23.6, 2], [24.8, 10.8, 0]]) {
    objeto(m, A.arbusto(v), px(x), px(y), { solido: { w: 14, h: 5 } });
  }
  for (let i = 0; i < 46; i++) {
    const x = 1.5 + ((i * 7.31) % 37);
    const y = 4.6 + ((i * 4.77) % 20);
    if (x > 9 && x < 19.5 && y > 8.4 && y < 16) continue; // calçada do poço
    if (x > 18.6 && x < 22.4 && y > 13.6) continue; // caminho sul
    if (x > 16.6 && y > 11.6 && y < 14.2) continue; // caminho da gruta
    if (x < 12.5 && y > 13.6 && y < 17.2) continue; // estrada
    if (x > 26.5 && y < 12.2) continue; // gruta
    objeto(m, A.capim(i % 3), px(x), px(y));
  }

  // Limite de baixo: pedras e arbustos
  for (let x = 1.6; x < 39; x += 2.6) {
    if (x > 18 && x < 23) continue;
    const i = Math.round(x * 5);
    objeto(m, i % 2 ? A.arbusto(i % 3) : A.rocha(i % 2), px(x), px(25.9), { solido: { w: 14, h: 5 } });
  }

  // ---------- Marcas da luz negra ----------
  marca(m, desenharSimbolo("gota"), px(10.6), px(13.1) - 8, {
    ativa: () => R.cantaro.visivel,
    aoRevelar: async (j) => {
      await j.falar(D.achouGota);
      j.simbolo("gota", "Gota");
      j.pista("poco-gota", "No cântaro da samaritana: o símbolo de uma gota.", "Poço de Jacó");
      j.objetivo(objetivoAtual(j));
    },
  });
  marca(m, textoPixel("PRIMEIRO A TALHA,\nDEPOIS A FONTE"), px(14), px(13.6), {
    ativa: (j) => j.flag("poco.conversa"),
    aoRevelar: async (j) => {
      j.flag("poco.inscricao", true);
      j.pista("poco-ordem", "No chão, junto ao poço: “Primeiro a talha, depois a fonte.” Uma seta aponta para a gruta.", "Poço de Jacó");
      await j.falar(D.inscricaoPoco);
      j.objetivo(objetivoAtual(j));
    },
  });
  for (const [x, y, a] of [[18.8, 13, -0.1], [22.4, 12.9, 0], [26.4, 12.9, 0], [30.2, 12.9, 0], [33.5, 12.6, -Math.PI / 2]]) {
    marca(m, setaPixel(a), px(x), px(y), { ativa: (j) => j.flag("poco.conversa") });
  }
  marca(m, imagemChave(2), px(30.9), px(2.9), {
    aoRevelar: async (j) => {
      j.pista("chave2", "Outra chave desenhada na rocha da gruta, agora com o número 2.", "Poço de Jacó");
    },
  });

  // Ao chegar perto do poço, começa a conversa de Jesus com a samaritana.
  m.zonas.push({
    x: px(8.4),
    y: px(8.2),
    w: px(12),
    h: px(9),
    ativa: (j) => !j.flag("poco.conversa"),
    aoEntrar: (j) => j.cena(() => cenaConversa(j)),
  });
}

// Passagem escura que aparece quando a porta de pedra se abre.
function criarAbertura() {
  const c = criarCanvas(28, 32);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#06040c";
  ctx.fillRect(2, 4, 24, 28);
  ctx.fillRect(4, 2, 20, 2);
  ctx.fillRect(7, 0, 14, 2);
  const g = ctx.createLinearGradient(0, 14, 0, 32);
  g.addColorStop(0, "rgba(70,90,160,0)");
  g.addColorStop(1, "rgba(70,90,160,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(4, 14, 20, 18);
  return c;
}

// ---------- Roteiro ----------
function objetivoAtual(j) {
  const s = j.estado.simbolos;
  if (!j.flag("poco.conversa")) return "Aproxime-se do poço, sem atrapalhar.";
  if (!s.includes("gota")) return "Examine o cântaro esquecido com a luz negra.";
  if (!j.flag("poco.inscricao")) return "Procure outra mensagem escondida perto do poço.";
  if (!j.flag("poco.mj")) return "Siga a seta até a gruta escura. Use a lanterna.";
  return "Encaixe os símbolos na porta de pedra da gruta.";
}

async function aoEntrar(jogo) {
  await jogo.ui.cartao("Capítulo II", "O Poço de Jacó", "João 4:1–42", 2800);
  await jogo.falar(D.intro);
  R.bea.olharPara(jogo.jogador.x, jogo.jogador.y);
  await jogo.falar(D.bea);
  jogo.objetivo(objetivoAtual(jogo));
}

async function cenaConversa(jogo) {
  if (jogo.flag("poco.conversa")) return;
  jogo.flag("poco.conversa", true);
  const { jesus, samaritana, bea } = R;
  const j = jogo.jogador;
  jogo.focar(px(14), px(11.8));
  // O jogador observa de uma distância respeitosa.
  if (j.y < px(13.2)) await j.andarAte(j.x < px(14) ? px(8.6) : px(19.6), j.y);
  await j.andarAte(j.x < px(14) ? px(8.6) : px(19.6), px(15.6));
  await j.andarAte(px(17.6), px(15.8));
  j.olharPara(px(14), px(12));
  j.angulo = -Math.PI / 2;
  jesus.parado = true;

  samaritana.visivel = true;
  samaritana.parado = true;
  await samaritana.seguirCaminho([[px(5), px(15.2)], [px(9.2), px(14.6)], [px(11), px(12.8)]], 34);
  samaritana.olharPara(jesus.x, jesus.y);
  jesus.olharPara(samaritana.x, samaritana.y);
  await jogo.esperar(0.4);
  await falarComGestos(jogo, D.conversa, { jesus, samaritana });

  // Ela deixa o cântaro e corre para a cidade (João 4:28).
  samaritana.folha = gerarFolha({ ...ELENCO.samaritana.sprite, acessorios: [] });
  R.cantaro.visivel = true;
  jogo.audio.sfx("balde");
  const corre = samaritana.seguirCaminho([[px(9.2), px(14.6)], [px(5), px(15.2)], [px(-2), px(15.2)]], 64);
  await jogo.falar(D.saida);
  await corre;
  samaritana.visivel = false;
  jesus.olharPara(px(10), px(15));

  bea.parado = true;
  await bea.seguirCaminho([[px(18.3), px(18.4)], [px(19.2), px(17)]], 46);
  bea.olharPara(j.x, j.y);
  await jogo.falar(D.beaDepois);
  bea.parado = false;
  bea.dirPadrao = "esq";
  jesus.parado = false;
  jesus.dirPadrao = "esq";
  jogo.focar(null);
  jogo.objetivo(objetivoAtual(jogo));
}

async function pocoAcao(jogo) {
  if (!jogo.flag("poco.conversa")) return cenaConversa(jogo);
  return jogo.falar(D.pocoExame);
}

async function jesusAcao(jogo) {
  if (!jogo.flag("poco.conversa")) return cenaConversa(jogo);
  return jogo.falar(D.jesusDepois);
}

async function beaAcao(jogo) {
  if (!jogo.flag("poco.conversa")) return jogo.falar(D.bea);
  if (!jogo.estado.simbolos.includes("gota")) return jogo.falar(D.beaDepois);
  return jogo.falar(D.beaFim);
}

async function mjAcao(jogo) {
  if (jogo.flag("poco.mj")) return jogo.falar(D.mjDepois);
  await jogo.falar(D.mj);
  jogo.flag("poco.mj", true);
  jogo.objetivo(objetivoAtual(jogo));
}

async function portaAcao(jogo) {
  if (jogo.flag("poco.aberta")) return sair(jogo);
  const s = jogo.estado.simbolos;
  if (!s.includes("talha") || !s.includes("gota")) return jogo.falar(D.portaSemPistas);
  if (!jogo.flag("poco.mj")) {
    jogo.flag("poco.mj", true);
    await jogo.falar(D.mj);
  }
  const ok = await jogo.ui.enigmas.simbolos({
    titulo: "Porta de pedra",
    texto: "Dois encaixes redondos. Toque nos símbolos na ordem certa.",
    opcoes: ["peixe", "talha", "estrela", "gota", "chave"],
    resposta: ["talha", "gota"],
    dicaErro: "A pedra não se mexe. Lembre da inscrição junto ao poço.",
  });
  if (!ok) return;
  jogo.flag("poco.aberta", true);
  jogo.objetivo("");
  jogo.focar(px(33.5), px(3.6));
  jogo.audio.sfx("pedra");
  jogo.tremer(1.5, 1.8);
  jogo.vibrar([40, 60, 40, 60, 80]);
  R.abertura.visivel = true;
  await animar(1.9, (k) => {
    R.porta.y = R.portaY + Math.round(suave(k) * 4);
    R.porta.alfa = 1 - suave(k);
    if (Math.random() < 0.7) {
      jogo.particulas.emitir({
        x: px(33.5) + (Math.random() - 0.5) * 30,
        y: px(4) - Math.random() * 4,
        vx: (Math.random() - 0.5) * 16,
        vy: -6 - Math.random() * 10,
        vida: 0.8 + Math.random() * 0.6,
        cor: "#b8a88e",
        emissiva: true,
      });
    }
  });
  R.porta.visivel = false;
  jogo.audio.sfx("passagem");
  R.mj.olharPara(px(33.5), px(3));
  await jogo.falar(D.portaAberta);
  jogo.focar(null);
  await sair(jogo);
}

async function sair(jogo) {
  const j = jogo.jogador;
  await j.andarAte(px(33.5), px(4) + 10);
  await j.andarAte(px(33.5), px(4) - 2);
  await jogo.carregarSala("betesda");
}

function atualizar(jogo, dt) {
  const j = jogo.jogador;
  ambiente(jogo, dt, {
    folhas: OLIVEIRAS.map(([x, y]) => ({ x: px(x) - 20, y: px(y) - 50, w: 40, h: 26, taxa: 0.12 })),
    sol: 3,
    poeiraFeixe: () => j && j.x > px(27) && j.y < px(12.4),
  });
}

// Calor do meio-dia: um véu dourado vindo de cima, mais fraco dentro da gruta.
function desenharPorCima(ctx, cx, cy, jogo) {
  const { w, h } = jogo.tela;
  const j = jogo.jogador;
  const naGruta = j && j.x > px(27) && j.y < px(12.4);
  const a = naGruta ? 0.025 : 0.09;
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, 0, w * 0.5, h);
  g.addColorStop(0, `rgba(255,224,150,${a})`);
  g.addColorStop(1, "rgba(255,224,150,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

export const poco = { def, montar, aoEntrar, atualizar, desenharPorCima };
