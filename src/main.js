// Ponto de entrada: carrega os recursos, mostra a tela título e roda o laço do jogo.
import { Jogo, estadoInicial } from "./jogo.js";
import { carregarRetratos } from "./ui/retratos.js";
import { SALAS } from "./salas/index.js";
import { DEBUG, SALA_INICIAL } from "./config.js";

const $ = (id) => document.getElementById(id);
const jogo = new Jogo();
if (DEBUG) window.jogo = jogo;

// ---------- Bloqueios do navegador (celular) ----------
// Zoom por pinça ou toque duplo, menu de toque longo, seleção e rolagem.
for (const ev of ["gesturestart", "gesturechange", "gestureend", "dblclick", "contextmenu", "selectstart"]) {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener(
  "touchmove",
  (e) => {
    if (!e.target.closest?.(".painel")) e.preventDefault();
  },
  { passive: false },
);
let ultimoToque = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const agora = Date.now();
    if (agora - ultimoToque < 300 && !e.target.closest?.("button, .painel")) e.preventDefault();
    ultimoToque = agora;
  },
  { passive: false },
);

// O som só pode começar depois do primeiro toque/tecla.
const liberarSom = () => jogo.audio.iniciar();
window.addEventListener("pointerdown", liberarSom, { once: true, capture: true });
window.addEventListener("keydown", liberarSom, { once: true, capture: true });

// ---------- Laço principal ----------
let anterior = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, Math.max(0, (agora - anterior) / 1000));
  anterior = agora;
  try {
    jogo.atualizar(dt);
    jogo.desenhar();
  } catch (erro) {
    console.error(erro);
  }
  requestAnimationFrame(quadro);
}

// ---------- Botões ----------
let comecando = false;
async function comecar(continuar) {
  if (comecando || jogo.modo !== "titulo") return;
  comecando = true;
  await jogo.comecar(continuar);
}
$("btn-comecar").addEventListener("click", () => comecar(false));
$("btn-continuar").addEventListener("click", () => comecar(true));
$("btn-acampadentro").addEventListener("click", () => jogo.abrirAcampadentro());
$("btn-reiniciar").addEventListener("click", () => jogo.reiniciar());

// Atalho de testes: ?debug&sala=poco começa direto numa sala.
async function comecarEm(id) {
  jogo.audio.iniciar();
  $("titulo").hidden = true;
  jogo.estado = estadoInicial();
  jogo.estado.simbolos = { cana: [], poco: ["talha"], betesda: ["talha", "gota"] }[id] ?? [];
  jogo.estado.uvLiberada = id !== "cana";
  jogo.modo = "jogo";
  jogo.ui.emJogo = true;
  await jogo.carregarSala(id);
}

async function iniciar() {
  requestAnimationFrame(quadro);
  const fonte = document.fonts?.load?.('16px "Pixelify Sans"').catch(() => {}) ?? Promise.resolve();
  await Promise.all([carregarRetratos((p) => jogo.ui.progresso(p * 0.6)), fonte]);
  jogo.ui.progresso(0.75);
  await jogo.carregarSala("titulo", { semFade: true });
  jogo.ui.progresso(1);
  jogo.ui.esconderCarregando();
  if (jogo.progressoSalvo()) $("btn-continuar").hidden = false;
  if (DEBUG && SALA_INICIAL && SALAS[SALA_INICIAL]) await comecarEm(SALA_INICIAL);
}

iniciar();
