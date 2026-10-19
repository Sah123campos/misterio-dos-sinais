// Diário de investigação: objetivo, símbolos, pistas e leituras.
import { SIMBOLOS, iconeSimbolo } from "../arte/simbolos.js";

const $ = (id) => document.getElementById(id);
const ORDEM_SIMBOLOS = ["talha", "gota", "maca"];

export class Diario {
  constructor(jogo) {
    this.jogo = jogo;
    this.el = $("diario");
    this.aberto = false;
    this.el.addEventListener("pointerdown", (e) => {
      if (e.target === this.el || e.target.closest("[data-fechar]")) {
        e.preventDefault();
        this.fechar();
      }
    });
  }

  abrir() {
    const est = this.jogo.estado;
    $("diario-objetivo").textContent = est.objetivo || "Explore o lugar.";
    const box = $("diario-simbolos");
    box.innerHTML = "";
    for (const id of ORDEM_SIMBOLOS) {
      const achado = est.simbolos.includes(id);
      const d = document.createElement("div");
      d.className = "simbolo-slot" + (achado ? " achado" : "");
      d.append(iconeSimbolo(id, achado), document.createTextNode(achado ? SIMBOLOS[id].nome : "?"));
      box.append(d);
    }
    const ul = $("diario-pistas");
    ul.innerHTML = "";
    if (!est.pistas.length) {
      const li = document.createElement("li");
      li.innerHTML = "<small>Nenhuma pista ainda. Use a lanterna nos cantos escuros.</small>";
      ul.append(li);
    }
    for (const p of est.pistas) {
      const li = document.createElement("li");
      li.textContent = p.texto;
      if (p.local) {
        const s = document.createElement("small");
        s.textContent = ` — ${p.local}`;
        li.append(s);
      }
      ul.append(li);
    }
    this.el.hidden = false;
    this.aberto = true;
    this.jogo.audio?.sfx("pagina");
    this.jogo.ui.atualizar();
  }

  fechar() {
    if (!this.aberto) return;
    this.el.hidden = true;
    this.aberto = false;
    this.jogo.audio?.sfx("pagina");
    this.jogo.ui.atualizar();
  }
}
