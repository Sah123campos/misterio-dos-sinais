// Interface: junta HUD, diálogo, diário, enigmas, controles de toque e telas.
import { Dialogo } from "./dialogo.js";
import { Diario } from "./diario.js";
import { Enigmas } from "./enigmas.js";
import { ControlesToque } from "./toque.js";
import { iconeSimbolo } from "../arte/simbolos.js";

const $ = (id) => document.getElementById(id);
const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

export class Interface {
  constructor(jogo) {
    this.jogo = jogo;
    this.dialogo = new Dialogo(jogo);
    this.diario = new Diario(jogo);
    this.enigmas = new Enigmas(jogo);
    this.toque = new ControlesToque(jogo);
    this.hud = $("hud");
    this.toqueEl = $("toque");
    this.avisos = [];
    this.mostrandoAviso = false;
    this.emJogo = false;

    $("btn-pausa").addEventListener("click", () => jogo.pausar());
    $("btn-som").addEventListener("click", () => jogo.alternarSom());
    jogo.entrada.aoMudarDispositivo(() => this.atualizar());

    // Pausa
    $("pausa").addEventListener("click", (e) => {
      const b = e.target.closest("[data-acao]");
      if (!b) return;
      const acao = b.dataset.acao;
      if (acao === "continuar") jogo.continuar();
      if (acao === "diario") {
        jogo.continuar();
        this.diario.abrir();
      }
      if (acao === "som") jogo.alternarSom();
      if (acao === "vozes") {
        jogo.config.vozes = !jogo.config.vozes;
        jogo.salvarConfig();
        this.atualizarMenu();
      }
      if (acao === "telacheia") jogo.telaCheia(true);
      if (acao === "reiniciar") jogo.reiniciar();
    });
  }

  atualizar() {
    const j = this.jogo;
    const toque = j.entrada.dispositivo === "toque";
    document.body.classList.toggle("toque-ativo", toque);
    const sobreposto = this.dialogo.aberto || this.diario.aberto || this.enigmas.aberto || j.pausado || j.emCartao;
    this.hud.hidden = !this.emJogo;
    this.toqueEl.hidden = !this.emJogo || !toque || sobreposto || j.emCena > 0;
    $("btn-uv").hidden = !j.estado.uvLiberada;
    $("dica-uv").hidden = !j.estado.uvLiberada;
    $("btn-lanterna").classList.toggle("ligado", j.lanterna === "normal");
    $("btn-uv").classList.toggle("ligado", j.lanterna === "uv");
    $("btn-som").querySelector(".ico").className = "ico " + (j.config.som ? "ico-som" : "ico-mudo");
    if (sobreposto || j.emCena > 0) {
      this.toque.soltar();
      $("prompt").hidden = true;
    }
  }

  atualizarMenu() {
    const j = this.jogo;
    document.querySelector('#pausa [data-acao="som"]').textContent = `Som: ${j.config.som ? "ligado" : "desligado"}`;
    document.querySelector('#pausa [data-acao="vozes"]').textContent = `Vozes: ${j.config.vozes ? "ligadas" : "desligadas"}`;
  }

  // Alvo de interação atual (destaca o botão e mostra o aviso "E ...").
  definirAlvo(alvo) {
    const rotulo = alvo?.interacao?.rotulo ?? "";
    if (this.ultimoRotulo === rotulo && this.ultimoAlvo === alvo) return;
    this.ultimoRotulo = rotulo;
    this.ultimoAlvo = alvo;
    const btn = $("btn-interagir");
    btn.classList.toggle("disponivel", !!alvo);
    $("btn-interagir-texto").textContent = alvo ? rotulo : "Interagir";
    const prompt = $("prompt");
    prompt.hidden = !alvo || this.jogo.entrada.dispositivo === "toque";
    $("prompt-texto").textContent = rotulo;
    if (alvo) this.jogo.vibrar(6);
  }

  objetivo(texto) {
    const el = $("objetivo");
    $("objetivo-texto").textContent = texto;
    el.hidden = !texto;
    el.classList.remove("novo");
    void el.offsetWidth;
    el.classList.add("novo");
  }

  // Aviso de descoberta no topo da tela (fila).
  aviso(html, simbolo) {
    this.avisos.push({ html, simbolo });
    if (!this.mostrandoAviso) this.proximoAviso();
  }

  async proximoAviso() {
    const a = this.avisos.shift();
    if (!a) {
      this.mostrandoAviso = false;
      return;
    }
    this.mostrandoAviso = true;
    const el = $("aviso");
    el.innerHTML = "";
    if (a.simbolo) el.append(iconeSimbolo(a.simbolo, true));
    const span = document.createElement("span");
    span.innerHTML = a.html;
    el.append(span);
    el.hidden = false;
    await esperar(2600);
    el.hidden = true;
    await esperar(200);
    this.proximoAviso();
  }

  async cartao(num, titulo, sub, duracao = 2600) {
    const el = $("cartao");
    $("cartao-num").textContent = num;
    $("cartao-titulo").textContent = titulo;
    $("cartao-sub").textContent = sub;
    el.classList.remove("saindo");
    el.hidden = false;
    this.jogo.emCartao = true;
    this.atualizar();
    await esperar(duracao);
    el.classList.add("saindo");
    await esperar(800);
    el.hidden = true;
    this.jogo.emCartao = false;
    this.atualizar();
  }

  async fade(ativo, ms = 500) {
    const el = $("fade");
    el.style.transitionDuration = `${ms}ms`;
    el.classList.toggle("ativo", ativo);
    await esperar(ms + 30);
  }

  progresso(p) {
    $("carregando-progresso").style.width = `${Math.round(p * 100)}%`;
  }

  esconderCarregando() {
    const el = $("carregando");
    el.classList.add("oculto");
    setTimeout(() => (el.hidden = true), 700);
  }

  mostrarPausa(ativo) {
    $("pausa").hidden = !ativo;
    this.atualizarMenu();
    this.atualizar();
  }
}
