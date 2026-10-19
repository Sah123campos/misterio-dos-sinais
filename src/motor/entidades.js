// Entidades do mundo: objetos, personagens e o jogador.
import { LARG, ALT } from "../arte/personagens.js";
import { VELOCIDADE_JOGADOR } from "../config.js";

const LINHA_DIR = { baixo: 0, esq: 1, dir: 2, cima: 3 };

export class Entidade {
  constructor(o = {}) {
    this.id = o.id ?? null;
    this.x = o.x ?? 0;
    this.y = o.y ?? 0;
    this.solido = o.solido ?? null; // { w, h, ox?, oy? } — caixa apoiada na base
    this.interacao = o.interacao ?? null; // { rotulo, acao(jogo, ent), raio?, ativo?(jogo) }
    this.camada = o.camada ?? "mundo"; // "chao" | "mundo" | "frente"
    this.visivel = o.visivel ?? true;
    this.alfa = 1;
    this.profundidade = o.profundidade ?? 0; // ajuste fino da ordem
  }

  get base() {
    return this.y + this.profundidade;
  }

  caixa() {
    if (!this.solido) return null;
    const { w, h, ox = 0, oy = 0 } = this.solido;
    return { x: this.x - w / 2 + ox, y: this.y - h + oy, w, h };
  }

  // Ponto onde fica o marcador de interação.
  pontoMarcador() {
    return { x: this.x, y: this.y - (this.alturaMarcador ?? 24) };
  }

  interativa(jogo) {
    if (!this.interacao || !this.visivel) return false;
    return this.interacao.ativo ? this.interacao.ativo(jogo, this) : true;
  }

  atualizar() {}
  desenhar() {}
}

// Imagem fixa ou animada.
export class Sprite extends Entidade {
  constructor(o) {
    super(o);
    this.img = o.img ?? null;
    this.quadros = o.quadros ?? null;
    this.fps = o.fps ?? 8;
    this.ax = o.ax ?? 0;
    this.ay = o.ay ?? 0;
    this.sombra = o.sombra ?? null; // { rx, ry, ox?, oy? }
    this.alturaMarcador = o.alturaMarcador ?? (this.img?.height ?? this.quadros?.[0].height ?? 24) - 2;
    this.t = Math.random() * 10;
    this.aoDesenhar = o.aoDesenhar ?? null; // extra por cima (ex.: conteúdo da talha)
  }

  atualizar(dt) {
    this.t += dt;
  }

  imagemAtual() {
    if (this.quadros) return this.quadros[Math.floor(this.t * this.fps) % this.quadros.length];
    return this.img;
  }

  desenhar(ctx, cx, cy, jogo) {
    if (!this.visivel) return;
    const img = this.imagemAtual();
    const x = Math.round(this.x - cx);
    const y = Math.round(this.y - cy);
    if (this.sombra) desenharSombra(ctx, x + (this.sombra.ox ?? 0), y + (this.sombra.oy ?? 0), this.sombra.rx, this.sombra.ry);
    if (img) {
      if (this.alfa < 1) ctx.globalAlpha = this.alfa;
      ctx.drawImage(img, x - this.ax, y - this.ay);
      ctx.globalAlpha = 1;
    }
    if (this.aoDesenhar) this.aoDesenhar(ctx, x, y, jogo, this);
  }
}

export function desenharSombra(ctx, x, y, rx, ry) {
  ctx.fillStyle = "rgba(12,6,24,0.38)";
  for (let j = -ry; j <= ry; j++) {
    const w = Math.round(rx * Math.sqrt(1 - (j / (ry + 0.5)) ** 2));
    ctx.fillRect(x - w, y + j, w * 2, 1);
  }
}

// Personagem com folha de sprites (4 direções, parado/andar/gesto).
export class Personagem extends Entidade {
  constructor(o) {
    super(o);
    this.folha = o.folha;
    this.nome = o.nome ?? "";
    this.retrato = o.retrato ?? null;
    this.dir = o.dir ?? "baixo";
    this.dirPadrao = this.dir;
    this.anim = "parado";
    this.t = Math.random() * 2;
    this.velocidade = o.velocidade ?? 42;
    this.alvos = [];
    this.aoChegar = null;
    this.gestoAte = 0;
    this.olharJogador = o.olharJogador ?? true;
    this.gesticula = o.gesticula ?? false;
    this.proximoGesto = 2 + Math.random() * 4;
    this.brilho = o.brilho ?? false;
    this.alturaMarcador = 30;
    this.solido = o.solido === undefined ? { w: 10, h: 5 } : o.solido;
    this.parado = false;
  }

  andarAte(x, y, velocidade) {
    return this.seguirCaminho([[x, y]], velocidade);
  }

  seguirCaminho(pontos, velocidade) {
    this.alvos = pontos.map(([x, y]) => ({ x, y }));
    if (velocidade) this.velocidade = velocidade;
    return new Promise((ok) => {
      this.aoChegar = ok;
    });
  }

  olharPara(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? "dir" : "esq";
    else this.dir = dy > 0 ? "baixo" : "cima";
  }

  gesticular(seg = 1) {
    this.gestoAte = this.t + seg;
  }

  atualizar(dt, jogo) {
    this.t += dt;
    if (this.alvos.length) {
      const alvo = this.alvos[0];
      const dx = alvo.x - this.x;
      const dy = alvo.y - this.y;
      const d = Math.hypot(dx, dy);
      const passo = this.velocidade * dt;
      if (d <= passo) {
        this.x = alvo.x;
        this.y = alvo.y;
        this.alvos.shift();
        if (!this.alvos.length) {
          this.anim = "parado";
          const f = this.aoChegar;
          this.aoChegar = null;
          f?.();
        }
      } else {
        this.x += (dx / d) * passo;
        this.y += (dy / d) * passo;
        this.olharPara(alvo.x, alvo.y);
        this.anim = "andar";
      }
      return;
    }
    this.anim = this.gestoAte > this.t ? "gesto" : "parado";
    // Vira para o jogador quando ele se aproxima; gesticula de vez em quando.
    const j = jogo?.jogador;
    if (j && this.olharJogador && !this.parado) {
      const perto = Math.hypot(j.x - this.x, j.y - this.y) < 42;
      if (perto) this.olharPara(j.x, j.y);
      else this.dir = this.dirPadrao;
    }
    if (this.gesticula && !this.parado) {
      this.proximoGesto -= dt;
      if (this.proximoGesto <= 0) {
        this.gesticular(0.7 + Math.random() * 0.6);
        this.proximoGesto = 3 + Math.random() * 5;
      }
    }
  }

  coluna() {
    if (this.anim === "andar") return 2 + (Math.floor(this.t * 8) % 4);
    if (this.anim === "gesto") return 6;
    return Math.floor(this.t * 1.7) % 2;
  }

  desenhar(ctx, cx, cy) {
    if (!this.visivel) return;
    const x = Math.round(this.x - cx);
    const y = Math.round(this.y - cy);
    if (this.brilho) {
      const g = ctx.createRadialGradient(x, y - 12, 2, x, y - 12, 22);
      g.addColorStop(0, "rgba(255,236,170,0.32)");
      g.addColorStop(1, "rgba(255,236,170,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 24, y - 36, 48, 48);
    }
    desenharSombra(ctx, x, y, 6, 2);
    if (this.alfa < 1) ctx.globalAlpha = this.alfa;
    ctx.drawImage(this.folha, this.coluna() * LARG, LINHA_DIR[this.dir] * ALT, LARG, ALT, x - LARG / 2, y - ALT + 1, LARG, ALT);
    ctx.globalAlpha = 1;
  }
}

// O jogador: anda com o teclado/joystick e colide com o cenário.
export class Jogador extends Personagem {
  constructor(o) {
    super({ ...o, olharJogador: false, solido: null });
    this.caixaColisao = { w: 9, h: 5 };
    this.angulo = Math.PI / 2; // direção da lanterna (radianos)
    this.tempoPasso = 0;
    this.andando = false;
    this.travado = false;
  }

  caixaEm(x, y) {
    const { w, h } = this.caixaColisao;
    return { x: x - w / 2, y: y - h, w, h };
  }

  atualizar(dt, jogo) {
    this.t += dt;
    if (this.alvos.length) {
      super.atualizar(dt, jogo);
      this.angulo = { baixo: Math.PI / 2, cima: -Math.PI / 2, esq: Math.PI, dir: 0 }[this.dir];
      return;
    }
    const v = this.travado ? { x: 0, y: 0 } : jogo.entrada.eixo();
    const mag = Math.hypot(v.x, v.y);
    this.andando = mag > 0.05;
    if (this.andando) {
      const vel = VELOCIDADE_JOGADOR * Math.min(1, mag * 1.1);
      const nx = this.x + v.x * vel * dt;
      const ny = this.y + v.y * vel * dt;
      const m = jogo.mundo;
      if (!m.colide(this.caixaEm(nx, this.y), this)) this.x = nx;
      else this.deslizar(m, v.x * vel * dt, 0);
      if (!m.colide(this.caixaEm(this.x, ny), this)) this.y = ny;
      else this.deslizar(m, 0, v.y * vel * dt);
      if (Math.abs(v.x) > Math.abs(v.y) * 1.05) this.dir = v.x > 0 ? "dir" : "esq";
      else this.dir = v.y > 0 ? "baixo" : "cima";
      // A lanterna gira suavemente na direção do movimento.
      const alvo = Math.atan2(v.y, v.x);
      let diff = alvo - this.angulo;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.angulo += diff * Math.min(1, dt * 14);
      this.anim = "andar";
      this.tempoPasso -= dt * Math.max(0.6, mag);
      if (this.tempoPasso <= 0) {
        this.tempoPasso = 0.3;
        jogo.audio?.passo(m.terrenoEm(this.x, this.y - 2));
      }
    } else {
      this.anim = "parado";
      this.tempoPasso = 0.05;
    }
  }

  // Quando bate de raspão num canto, desliza um pouco para contornar.
  deslizar(m, dx, dy) {
    for (const off of [1, -1, 2, -2, 3, -3]) {
      if (dx) {
        if (!m.colide(this.caixaEm(this.x + dx, this.y + off), this) && !m.colide(this.caixaEm(this.x, this.y + off), this)) {
          this.y += Math.sign(off) * 0.6;
          return;
        }
      } else if (!m.colide(this.caixaEm(this.x + off, this.y + dy), this) && !m.colide(this.caixaEm(this.x + off, this.y), this)) {
        this.x += Math.sign(off) * 0.6;
        return;
      }
    }
  }
}
