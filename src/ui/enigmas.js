// Enigmas com interface grande, fácil de resolver pelo toque.
import { SIMBOLOS, iconeSimbolo } from "../arte/simbolos.js";

const $ = (id) => document.getElementById(id);

export class Enigmas {
  constructor(jogo) {
    this.jogo = jogo;
    this.el = $("enigma");
    this.corpo = $("enigma-corpo");
    this.retorno = $("enigma-retorno");
    this.aberto = false;
    this.resolver = null;
    this.el.addEventListener("pointerdown", (e) => {
      if (e.target === this.el || e.target.closest("[data-fechar]")) {
        e.preventDefault();
        this.fechar(false);
      }
    });
  }

  abrirBase(titulo, texto) {
    $("enigma-titulo").textContent = titulo;
    $("enigma-texto").textContent = texto;
    this.corpo.innerHTML = "";
    this.mensagem("");
    this.el.hidden = false;
    this.aberto = true;
    this.jogo.ui.atualizar();
    return new Promise((ok) => (this.resolver = ok));
  }

  fechar(resultado) {
    if (!this.aberto) return;
    this.el.hidden = true;
    this.aberto = false;
    this.jogo.ui.atualizar();
    const r = this.resolver;
    this.resolver = null;
    r?.(resultado);
  }

  mensagem(texto, tipo = "") {
    this.retorno.textContent = texto;
    this.retorno.className = "enigma-retorno " + tipo;
  }

  errar(texto) {
    this.mensagem(texto, "erro");
    const painel = this.el.querySelector(".painel");
    painel.classList.remove("tremer");
    void painel.offsetWidth;
    painel.classList.add("tremer");
    this.jogo.audio?.sfx("erro");
    this.jogo.vibrar([30, 40, 30]);
  }

  acertar(texto) {
    this.mensagem(texto, "ok");
    this.jogo.audio?.sfx("acerto");
    this.jogo.vibrar([20, 30, 60]);
    setTimeout(() => this.fechar(true), 900);
  }

  // Cadeado de um dígito (1 a 9).
  numero({ titulo, texto, resposta, dicaErro }) {
    const p = this.abrirBase(titulo, texto);
    let valor = 1;
    const cad = document.createElement("div");
    cad.className = "cadeado";
    const dig = document.createElement("div");
    dig.className = "cadeado-digito";
    dig.textContent = valor;
    const setas = document.createElement("div");
    setas.className = "cadeado-setas";
    const mudar = (d) => {
      valor = ((valor - 1 + d + 9) % 9) + 1;
      dig.textContent = valor;
      this.jogo.audio?.sfx("clique");
      this.mensagem("");
    };
    for (const [rotulo, d] of [["▲", 1], ["▼", -1]]) {
      const b = document.createElement("button");
      b.className = "btn-seta";
      b.textContent = rotulo;
      b.addEventListener("click", () => mudar(d));
      setas.append(b);
    }
    cad.append(dig, setas);
    const ok = document.createElement("button");
    ok.className = "btn btn-principal";
    ok.textContent = "Girar a fechadura";
    ok.addEventListener("click", () => {
      if (valor === resposta) this.acertar("Clique! A fechadura cedeu.");
      else this.errar(dicaErro || "Não abriu. Observe melhor o lugar.");
    });
    this.corpo.append(cad, ok);
    this.teclado = (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") mudar(1);
      if (e.code === "ArrowDown" || e.code === "KeyS") mudar(-1);
      if (e.code === "Enter" || e.code === "KeyE" || e.code === "Space") ok.click();
    };
    window.addEventListener("keydown", this.teclado);
    return p.finally(() => window.removeEventListener("keydown", this.teclado));
  }

  // Encaixar símbolos em ordem.
  simbolos({ titulo, texto, opcoes, resposta, dicaErro }) {
    const p = this.abrirBase(titulo, texto);
    const escolhidos = [];
    const encaixes = document.createElement("div");
    encaixes.className = "encaixes";
    const slots = resposta.map((_, i) => {
      const b = document.createElement("button");
      b.className = "encaixe";
      b.setAttribute("aria-label", `Encaixe ${i + 1}`);
      b.addEventListener("click", () => {
        escolhidos.splice(i);
        desenhar();
        this.jogo.audio?.sfx("clique");
      });
      encaixes.append(b);
      return b;
    });
    const desenhar = () => {
      slots.forEach((s, i) => {
        s.innerHTML = "";
        s.classList.toggle("cheio", !!escolhidos[i]);
        if (escolhidos[i]) s.append(iconeSimbolo(escolhidos[i], true));
      });
      this.mensagem("");
    };
    const grade = document.createElement("div");
    grade.className = "opcoes-simbolos";
    for (const id of opcoes) {
      const conhecido = this.jogo.estado.simbolos.includes(id);
      const b = document.createElement("button");
      b.className = "opcao-simbolo" + (conhecido ? " conhecido" : "");
      b.append(iconeSimbolo(id, true), document.createTextNode(SIMBOLOS[id].nome));
      b.addEventListener("click", () => {
        if (escolhidos.length >= resposta.length) escolhidos.length = 0;
        escolhidos.push(id);
        desenhar();
        this.jogo.audio?.sfx("encaixe");
        if (escolhidos.length === resposta.length) {
          setTimeout(() => {
            if (escolhidos.every((x, i) => x === resposta[i])) this.acertar("Os símbolos se encaixaram!");
            else {
              this.errar(dicaErro || "Nada acontece. Talvez a ordem esteja errada.");
              escolhidos.length = 0;
              setTimeout(desenhar, 700);
            }
          }, 250);
        }
      });
      grade.append(b);
    }
    this.corpo.append(encaixes, grade);
    desenhar();
    return p;
  }
}
