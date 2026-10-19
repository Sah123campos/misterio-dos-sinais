// Caixa de diálogo com retrato, nome e texto em máquina de escrever.
// Toque em qualquer parte da caixa (ou E / Espaço / Enter) para avançar.
import { ELENCO } from "../dados/elenco.js";
import { retratoDe } from "./retratos.js";

const $ = (id) => document.getElementById(id);

export class Dialogo {
  constructor(jogo) {
    this.jogo = jogo;
    this.el = $("dialogo");
    this.nome = $("dialogo-nome");
    this.texto = $("dialogo-texto");
    this.ref = $("dialogo-ref");
    this.canvas = $("retrato-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.aberto = false;
    this.digitando = false;
    this.resolver = null;
    this.timer = null;
    this.el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.avancar();
    });
  }

  async falar(falas) {
    if (!Array.isArray(falas)) falas = [falas];
    this.aberto = true;
    this.el.hidden = false;
    this.jogo.ui.atualizar();
    for (const f of falas) await this.mostrar(f);
    this.el.hidden = true;
    this.aberto = false;
    this.pararVoz();
    this.jogo.ui.atualizar();
  }

  mostrar(f) {
    const p = ELENCO[f.quem];
    const escritura = f.estilo === "escritura" || f.quem === "narrador";
    this.el.classList.toggle("escritura", escritura);
    this.el.classList.remove("completo");
    this.nome.textContent = f.nome ?? (escritura ? f.ref ?? "" : p?.nome ?? "");
    this.ref.textContent = escritura ? "" : f.ref ?? "";
    const r = !escritura && f.quem ? retratoDe(f.quem) : null;
    this.el.classList.toggle("sem-retrato", !r);
    if (r) {
      this.canvas.width = r.width;
      this.canvas.height = r.height;
      this.canvas.style.imageRendering = r.dataset?.estilo === "foto" ? "auto" : "pixelated";
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(r, 0, 0);
    }
    this.falarEmVoz(f.texto, f.quem);
    return new Promise((ok) => {
      this.resolver = ok;
      this.digitar(f.texto, f.quem);
    });
  }

  digitar(texto, quem) {
    clearTimeout(this.timer);
    this.digitando = true;
    this.texto.textContent = "";
    let i = 0;
    const passo = () => {
      if (!this.digitando) return;
      i++;
      this.texto.textContent = texto.slice(0, i);
      const ch = texto[i - 1];
      if (i % 2 === 0 && ch !== " ") this.jogo.audio?.blip(quem);
      if (i >= texto.length) {
        this.digitando = false;
        this.el.classList.add("completo");
        return;
      }
      const pausa = ".!?".includes(ch) ? 170 : ch === "," ? 90 : 24;
      this.timer = setTimeout(passo, pausa);
    };
    this.textoCompleto = texto;
    passo();
  }

  avancar() {
    if (!this.aberto) return;
    if (this.digitando) {
      this.digitando = false;
      clearTimeout(this.timer);
      this.texto.textContent = this.textoCompleto;
      this.el.classList.add("completo");
      return;
    }
    if (this.resolver) {
      const r = this.resolver;
      this.resolver = null;
      this.jogo.audio?.sfx("avancar");
      this.pararVoz();
      r();
    }
  }

  // Leitura das falas em voz alta (opcional, depende do aparelho).
  falarEmVoz(texto, quem) {
    if (!this.jogo.config.vozes || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = "pt-BR";
      const vozes = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("pt"));
      const br = vozes.find((v) => v.lang.toLowerCase() === "pt-br") || vozes[0];
      if (br) u.voice = br;
      const feminino = ["debora", "bea", "thama", "maria", "samaritana", "noiva", "convidada1", "convidada2"].includes(quem);
      u.pitch = feminino ? 1.25 : quem === "jesus" ? 0.9 : 1;
      u.rate = 1.05;
      u.volume = 0.9;
      speechSynthesis.speak(u);
    } catch {
      /* voz indisponível */
    }
  }

  pararVoz() {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {
      /* nada */
    }
  }
}
