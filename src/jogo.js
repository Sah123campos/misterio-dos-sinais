// Jogo: junta todos os sistemas e oferece a "API" usada pelos roteiros das salas.
import { Tela } from "./motor/tela.js";
import { Entrada } from "./motor/entrada.js";
import { Iluminacao } from "./motor/luz.js";
import { Particulas } from "./motor/particulas.js";
import { Mundo } from "./motor/mundo.js";
import { Jogador } from "./motor/entidades.js";
import { MotorAudio } from "./audio/motor.js";
import { Interface } from "./ui/interface.js";
import { folhaDe } from "./ui/retratos.js";
import { criarCanvas, Pixmap, rgb } from "./arte/pixel.js";
import { SALAS } from "./salas/index.js";
import { TILE, LINK_ACAMPADENTRO } from "./config.js";

const CHAVE_PROGRESSO = "misterio-dos-sinais:progresso";
const CHAVE_CONFIG = "misterio-dos-sinais:config";
export const esperar = (seg) => new Promise((ok) => setTimeout(ok, seg * 1000));

function ler(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave) || "null");
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* navegação privada: segue sem salvar */
  }
}

export function estadoInicial() {
  return { sala: "cana", flags: {}, simbolos: [], pistas: [], objetivo: "", uvLiberada: false };
}

export class Jogo {
  constructor() {
    this.tela = new Tela(document.getElementById("tela"));
    this.ctx = this.tela.ctx;
    this.entrada = new Entrada();
    this.luz = new Iluminacao();
    this.particulas = new Particulas();
    this.audio = new MotorAudio();
    this.config = { som: true, vozes: false, vibracao: true, ...(ler(CHAVE_CONFIG) || {}) };
    this.audio.ligado = this.config.som;
    this.estado = estadoInicial();
    this.ui = new Interface(this);
    this.camera = { x: 0, y: 0, alvo: null };
    this.lanterna = "desligada";
    this.escuridao = 0;
    this.escuridaoAlvo = 0;
    this.pulso = 0;
    this.tensaoExtra = 0;
    this.emCena = 0;
    this.pausado = false;
    this.emCartao = false;
    this.t = 0;
    this.flash = null;
    this.tremor = 0;
    this.alvo = null;
    this.modo = "titulo";
    this.mundo = null;
    this.jogador = null;
    this.icones = criarIcones();
    this.luz.redimensionar(this.tela.w, this.tela.h);
    this.criarVinheta(this.tela.w, this.tela.h);
    this.tela.aoRedimensionar((w, h) => {
      this.luz.redimensionar(w, h);
      this.criarVinheta(w, h);
      if (this.mundo) this.atualizarCamera(0, true);
    });
  }

  // ---------- Salas ----------
  async carregarSala(id, { semFade = false } = {}) {
    this.emCena++;
    this.ui.atualizar();
    if (!semFade) await this.ui.fade(true, 650);
    const sala = SALAS[id];
    this.particulas.limpar();
    this.objetivo("");
    this.lanterna = "desligada";
    this.mundo = new Mundo(sala.def);
    const ini = sala.def.inicio;
    this.jogador = new Jogador({ folha: folhaDe("jogador"), x: ini.x * TILE, y: ini.y * TILE, dir: ini.dir ?? "cima" });
    this.jogador.angulo = { baixo: Math.PI / 2, cima: -Math.PI / 2, esq: Math.PI, dir: 0 }[this.jogador.dir];
    this.mundo.adicionar(this.jogador);
    this.sala = sala;
    this.estado.sala = id;
    this.tensaoExtra = 0;
    this.camera.alvo = null;
    sala.montar(this, this.mundo);
    this.escuridao = this.escuridaoAlvo = sala.def.escuridao ?? 0;
    if (sala.def.lanterna) this.lanterna = sala.def.lanterna;
    this.atualizarCamera(0, true);
    if (sala.def.musica) this.audio.tocar(sala.def.musica);
    if (id !== "titulo") this.salvarProgresso();
    await esperar(0.08);
    this.emCena--;
    if (!semFade) this.ui.fade(false, 800);
    this.ui.atualizar();
    if (sala.aoEntrar) this.cena(() => sala.aoEntrar(this));
  }

  salvarProgresso() {
    const e = this.estado;
    gravar(CHAVE_PROGRESSO, { sala: e.sala, simbolos: e.simbolos, pistas: e.pistas, uvLiberada: e.uvLiberada });
  }

  progressoSalvo() {
    const p = ler(CHAVE_PROGRESSO);
    return p && SALAS[p.sala] && p.sala !== "cana" ? p : null;
  }

  salvarConfig() {
    gravar(CHAVE_CONFIG, this.config);
  }

  // ---------- Início, pausa, fim ----------
  async comecar(continuar = false) {
    this.audio.iniciar();
    this.telaCheia(false);
    const salvo = continuar ? this.progressoSalvo() : null;
    this.estado = estadoInicial();
    if (salvo) Object.assign(this.estado, { simbolos: salvo.simbolos || [], pistas: salvo.pistas || [], uvLiberada: !!salvo.uvLiberada });
    document.getElementById("titulo").hidden = true;
    this.modo = "jogo";
    this.ui.emJogo = true;
    await this.carregarSala(salvo ? salvo.sala : "cana");
  }

  pausar() {
    if (this.modo !== "jogo" || this.pausado) return;
    this.pausado = true;
    this.ui.mostrarPausa(true);
  }

  continuar() {
    this.pausado = false;
    this.ui.mostrarPausa(false);
  }

  reiniciar() {
    try {
      localStorage.removeItem(CHAVE_PROGRESSO);
    } catch {
      /* ok */
    }
    location.reload();
  }

  alternarSom() {
    this.config.som = !this.config.som;
    this.audio.iniciar();
    this.audio.definirLigado(this.config.som);
    this.salvarConfig();
    this.ui.atualizar();
    this.ui.atualizarMenu();
  }

  // Tela cheia com a tela travada na horizontal. Os navegadores só permitem
  // isso logo depois de um toque; no iPhone não existe, e o jogo segue normal.
  telaCheia(forcar) {
    const toque = this.entrada.dispositivo === "toque";
    if (!forcar && !toque) return Promise.resolve(false);
    const el = document.documentElement;
    const travar = () => {
      try {
        screen.orientation?.lock?.("landscape")?.catch?.(() => {});
      } catch {
        /* sem trava de rotação */
      }
    };
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      travar();
      return Promise.resolve(true);
    }
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!pedir) return Promise.resolve(false);
    try {
      return Promise.resolve(pedir.call(el, { navigationUI: "hide" }))
        .then(() => {
          travar();
          return true;
        })
        .catch(() => false);
    } catch {
      return Promise.resolve(false);
    }
  }

  vibrar(padrao) {
    if (!this.config.vibracao || !navigator.vibrate) return;
    try {
      navigator.vibrate(padrao);
    } catch {
      /* sem vibração */
    }
  }

  async finalizar() {
    this.modo = "final";
    this.ui.emJogo = false;
    this.ui.atualizar();
    this.audio.tocar("revelacao", 2.5);
    const el = document.getElementById("final");
    el.hidden = false;
    const escrever = async (id, texto) => {
      const p = document.getElementById(id);
      p.textContent = "";
      for (let i = 1; i <= texto.length; i++) {
        p.textContent = texto.slice(0, i);
        if (i % 3 === 0) this.audio.blip("narrador");
        await esperar(0.035);
      }
    };
    await esperar(1.2);
    await escrever("final-linha1", "A investigação ainda não terminou.");
    await esperar(0.6);
    await escrever("final-linha2", "Algumas respostas só serão reveladas no próximo capítulo.");
    await esperar(1);
    document.getElementById("final-titulo").classList.add("visivel");
    this.audio.sfx("simbolo");
    await esperar(1.6);
    document.getElementById("final-botoes").classList.add("visivel");
    try {
      localStorage.removeItem(CHAVE_PROGRESSO);
    } catch {
      /* ok */
    }
  }

  abrirAcampadentro() {
    window.open(LINK_ACAMPADENTRO, "_blank", "noopener");
  }

  // ---------- API para roteiros ----------
  async cena(fn) {
    this.emCena++;
    this.ui.atualizar();
    try {
      await fn();
    } finally {
      this.emCena--;
      if (this.emCena === 0) this.desencalhar();
      this.ui.atualizar();
    }
  }

  // Se uma cena terminou com alguém parado em cima do jogador, empurra o
  // jogador para o espaço livre mais próximo (senão ele ficaria preso).
  desencalhar() {
    const j = this.jogador;
    const m = this.mundo;
    if (!j || !m || !m.colide(j.caixaEm(j.x, j.y), j)) return;
    for (let r = 2; r <= 40; r += 2) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = j.x + Math.cos(a) * r;
        const y = j.y + Math.sin(a) * r;
        if (!m.colide(j.caixaEm(x, y), j)) {
          j.x = x;
          j.y = y;
          return;
        }
      }
    }
  }

  falar(falas) {
    return this.ui.dialogo.falar(falas);
  }

  esperar(seg) {
    return esperar(seg);
  }

  objetivo(texto) {
    this.estado.objetivo = texto;
    this.ui.objetivo(texto);
  }

  flag(nome, valor) {
    if (valor !== undefined) this.estado.flags[nome] = valor;
    return this.estado.flags[nome];
  }

  pista(id, texto, local) {
    if (this.estado.pistas.some((p) => p.id === id)) return false;
    this.estado.pistas.push({ id, texto, local });
    this.ui.aviso(`<b>Nova pista:</b> ${texto}`);
    this.audio.sfx("revelar");
    this.pulso = 0.12;
    this.vibrar([15, 40, 15]);
    return true;
  }

  simbolo(id, nome) {
    if (this.estado.simbolos.includes(id)) return false;
    this.estado.simbolos.push(id);
    this.ui.aviso(`<b>Símbolo encontrado:</b> ${nome}`, id);
    this.audio.sfx("simbolo");
    this.piscar([170, 110, 255], 0.5);
    this.pulso = 0.18;
    this.vibrar([20, 50, 20, 50, 40]);
    return true;
  }

  piscar(cor, dur = 0.4, forca = 0.5) {
    this.flash = { cor, dur, t: dur, forca };
  }

  tremer(intensidade = 2, dur = 0.4) {
    this.tremor = intensidade;
    this.tremorDur = dur;
  }

  focar(x, y) {
    this.camera.alvo = x == null ? null : { x, y };
  }

  liberarUV() {
    this.estado.uvLiberada = true;
    this.ui.atualizar();
  }

  // ---------- Lanterna ----------
  alternarLanterna() {
    this.audio.iniciar();
    if (this.lanterna === "desligada") {
      this.lanterna = "normal";
      this.audio.sfx("lanterna");
    } else {
      this.lanterna = "desligada";
      this.audio.sfx("lanternaDesliga");
    }
    this.ui.atualizar();
  }

  alternarUV() {
    if (!this.estado.uvLiberada) {
      this.ui.aviso("Você ainda não tem uma <b>luz negra</b>.");
      return;
    }
    if (this.lanterna === "uv") {
      this.lanterna = "normal";
      this.audio.sfx("lanterna");
    } else {
      this.lanterna = "uv";
      this.audio.sfx("uv");
    }
    this.ui.atualizar();
  }

  // ---------- Laço principal ----------
  atualizar(dt) {
    this.t += dt;
    const e = this.entrada;
    const ui = this.ui;
    if (this.modo === "titulo") {
      this.sala?.atualizar?.(this, dt);
      this.mundo?.atualizar(dt, this);
      this.particulas.atualizar(dt);
      this.atualizarCamera(dt);
      e.limpar();
      return;
    }
    if (this.modo !== "jogo" || !this.mundo) {
      e.limpar();
      return;
    }
    if (e.acao("som")) this.alternarSom();
    if (e.acao("pausa")) {
      if (ui.diario.aberto) ui.diario.fechar();
      else if (ui.enigmas.aberto) ui.enigmas.fechar(false);
      else if (this.pausado) this.continuar();
      else if (!ui.dialogo.aberto) this.pausar();
    }
    if (this.pausado) {
      e.limpar();
      return;
    }
    if (ui.dialogo.aberto && e.acao("interagir")) ui.dialogo.avancar();
    if (e.acao("diario") && !ui.dialogo.aberto && !ui.enigmas.aberto && this.emCena === 0) {
      if (ui.diario.aberto) ui.diario.fechar();
      else ui.diario.abrir();
    }
    const livre = this.emCena === 0 && !ui.dialogo.aberto && !ui.diario.aberto && !ui.enigmas.aberto && !this.emCartao;
    this.jogador.travado = !livre;
    if (livre) {
      if (e.acao("lanterna")) this.alternarLanterna();
      if (e.acao("uv")) this.alternarUV();
    }
    this.mundo.atualizar(dt, this);
    this.particulas.atualizar(dt);
    this.sala?.atualizar?.(this, dt);
    this.emitirFagulhas(dt);

    this.alvo = livre ? this.acharAlvo() : null;
    ui.definirAlvo(this.alvo);
    if (livre && this.alvo && e.acao("interagir")) {
      const a = this.alvo;
      this.audio.iniciar();
      this.cena(() => a.interacao.acao(this, a));
    }
    if (livre) this.verificarRevelacoes(dt);

    this.pulso = Math.max(0, this.pulso - dt * 0.12);
    const alvoEscuro = Math.min(0.97, this.escuridaoAlvo + this.pulso);
    this.escuridao += (alvoEscuro - this.escuridao) * Math.min(1, dt * 1.6);
    this.atualizarTensao();
    if (this.flash) {
      this.flash.t -= dt;
      if (this.flash.t <= 0) this.flash = null;
    }
    if (this.tremor > 0) {
      this.tremorDur -= dt;
      if (this.tremorDur <= 0) this.tremor = 0;
    }
    this.atualizarCamera(dt);
    e.limpar();
  }

  acharAlvo() {
    const j = this.jogador;
    const v = { baixo: [0, 1], cima: [0, -1], esq: [-1, 0], dir: [1, 0] }[j.dir];
    const px = j.x + v[0] * 9;
    const py = j.y - 3 + v[1] * 9;
    let melhor = null;
    let md = 1e9;
    for (const ent of this.mundo.entidades) {
      if (ent === j || !ent.interativa(this)) continue;
      const pi = ent.pontoInteracao ? ent.pontoInteracao() : { x: ent.x, y: ent.y };
      const d = Math.hypot(pi.x - px, pi.y - py);
      const dCorpo = Math.hypot(pi.x - j.x, pi.y - j.y);
      const raio = ent.interacao.raio ?? 20;
      const dist = Math.min(d, dCorpo + 4);
      if (dist < raio && dist < md) {
        md = dist;
        melhor = ent;
      }
    }
    return melhor;
  }

  verificarRevelacoes(dt) {
    const j = this.jogador;
    for (const ins of this.mundo.uv) {
      if (ins.revelada || !ins.aoRevelar) continue;
      if (ins.ativa && !ins.ativa(this)) continue;
      const modoOk = ins.luz === "uv" ? this.lanterna === "uv" : this.lanterna !== "desligada";
      const f = modoOk ? Iluminacao.fatorFeixe(j, ins.x, ins.y) : 0;
      if (f > 0.45) {
        ins.tempo = (ins.tempo || 0) + dt;
        if (ins.tempo > 0.35) {
          ins.revelada = true;
          this.cena(() => ins.aoRevelar(this, ins));
          return;
        }
      } else ins.tempo = Math.max(0, (ins.tempo || 0) - dt);
    }
  }

  atualizarTensao() {
    let t = this.sala?.def.tensao ?? 0;
    if (this.lanterna === "uv") t += 0.3;
    if (this.escuridao > 0.7) t += 0.15;
    t += this.tensaoExtra;
    this.audio.tensao(Math.min(1, t));
  }

  emitirFagulhas(dt) {
    for (const l of this.mundo.luzes) {
      if (!l.fagulhas || l.ativa === false) continue;
      if (Math.random() < dt * 3) {
        this.particulas.emitir({
          x: l.x + (Math.random() - 0.5) * 4,
          y: l.y - 4,
          vx: (Math.random() - 0.5) * 8,
          vy: -18 - Math.random() * 14,
          vida: 0.6 + Math.random() * 0.8,
          cor: "#ffd27a",
          cor2: "#ff7a3a",
          emissiva: true,
        });
      }
    }
  }

  atualizarCamera(dt, instantaneo = false) {
    const { w, h } = this.tela;
    const m = this.mundo;
    const j = this.jogador;
    if (!m || !j) return;
    let tx;
    let ty;
    if (this.camera.alvo) {
      tx = this.camera.alvo.x - w / 2;
      ty = this.camera.alvo.y - h / 2;
    } else {
      tx = j.x - w / 2;
      ty = j.y - 14 - h / 2;
    }
    if (this.ui.dialogo.aberto) ty += h * 0.16;
    tx = m.L <= w ? (m.L - w) / 2 : Math.max(0, Math.min(m.L - w, tx));
    ty = m.A <= h ? (m.A - h) / 2 : Math.max(0, Math.min(m.A - h, ty));
    const k = instantaneo ? 1 : 1 - Math.exp(-dt * 6);
    this.camera.x += (tx - this.camera.x) * k;
    this.camera.y += (ty - this.camera.y) * k;
  }

  desenhar() {
    const ctx = this.ctx;
    const { w, h } = this.tela;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#07050f";
    ctx.fillRect(0, 0, w, h);
    if (!this.mundo) return;
    let cx = Math.round(this.camera.x);
    let cy = Math.round(this.camera.y);
    if (this.tremor > 0) {
      cx += Math.round((Math.random() - 0.5) * this.tremor * 2);
      cy += Math.round((Math.random() - 0.5) * this.tremor * 2);
    }
    this.mundo.desenhar(ctx, cx, cy, w, h, this.t, this);
    this.luz.desenhar(ctx, this, cx, cy, w, h, this.t);
    this.particulas.desenhar(ctx, cx, cy, true);
    this.sala?.desenharPorCima?.(ctx, cx, cy, this);
    this.desenharMarcador(ctx, cx, cy);
    if (this.flash) {
      const [r, g, b] = this.flash.cor;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(${r},${g},${b},${(this.flash.t / this.flash.dur) * this.flash.forca})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.drawImage(this.vinheta, 0, 0);
  }

  desenharMarcador(ctx, cx, cy) {
    const a = this.alvo;
    if (!a || this.modo !== "jogo") return;
    const p = a.pontoMarcador();
    const icone = this.icones[a.interacao.icone ?? "examinar"] ?? this.icones.examinar;
    const sobe = Math.round(Math.sin(this.t * 5) * 1.5);
    ctx.drawImage(icone, Math.round(p.x - cx - icone.width / 2), Math.round(p.y - cy - icone.height + sobe));
  }

  criarVinheta(w, h) {
    const c = criarCanvas(w, h);
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(5,3,12,0)");
    g.addColorStop(1, "rgba(5,3,12,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    this.vinheta = c;
  }
}

// Ícones pixelados que flutuam sobre o que pode ser investigado.
function criarIcones() {
  const fazer = (linhas, cores) => {
    const pm = new Pixmap(linhas[0].length, linhas.length);
    pm.mascara(linhas, cores);
    return pm.contorno(0.8).paraCanvas();
  };
  const cores = { o: rgb("#fff4d6"), g: rgb("#e2c070"), d: rgb("#8a6a2a"), v: rgb("#b48cff"), p: rgb("#2a1e3a") };
  return {
    examinar: fazer(
      [
        "..ooo...",
        ".oppgo..",
        "ogppgo..",
        "ogpppo..",
        ".oggo...",
        "..oo.d..",
        ".....dd.",
        "......dd",
      ],
      cores,
    ),
    falar: fazer(
      [
        ".oooooo.",
        "oggggggo",
        "ogpgpgpo",
        "oggggggo",
        ".oooooo.",
        "..oo....",
        "..o.....",
      ],
      cores,
    ),
    usar: fazer(
      [
        "...oo...",
        "..ogdo..",
        "..ogdo..",
        "..ogdo..",
        "..ogdo..",
        "........",
        "..ogdo..",
        "...oo...",
      ],
      cores,
    ),
  };
}
