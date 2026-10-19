// Mundo: a sala em execução (mapa, colisões, entidades, água e desenho em profundidade).
import { TILE } from "../config.js";
import { pintarCenario, SOLIDOS } from "../arte/terreno.js";
import { desenharAgua } from "../arte/objetos.js";

const SOM_TERRENO = {
  pedra: "pedra",
  lajota: "pedra",
  ladrilho: "pedra",
  terra: "terra",
  areia: "terra",
  grama: "grama",
  madeira: "madeira",
};

export class Mundo {
  constructor(def) {
    this.def = def;
    this.larg = def.larg;
    this.alt = def.alt;
    this.L = def.larg * TILE;
    this.A = def.alt * TILE;
    // Converte o mapa ASCII em nomes de terreno.
    this.grade = new Array(this.larg * this.alt);
    this.solidos = new Uint8Array(this.larg * this.alt);
    for (let y = 0; y < this.alt; y++) {
      const linha = def.mapa[y] || "";
      for (let x = 0; x < this.larg; x++) {
        const ch = linha[x] ?? " ";
        const tipo = def.legenda[ch] ?? "vazio";
        this.grade[y * this.larg + x] = tipo;
        this.solidos[y * this.larg + x] = SOLIDOS.has(tipo) || (def.solidosExtras || "").includes(ch) ? 1 : 0;
      }
    }
    this.chao = pintarCenario({ ...def, grade: this.grade });
    this.entidades = [];
    this.luzes = [];
    this.uv = [];
    this.zonas = [];
    this.bloqueios = (def.bloqueios || []).map((b) => ({ x: b.x * TILE, y: b.y * TILE, w: b.w * TILE, h: b.h * TILE }));
    this.aguas = (def.aguas || []).map((a) => ({ x: a.x * TILE, y: a.y * TILE, w: a.w * TILE, h: a.h * TILE, cores: a.cores }));
    this.extrasDesenho = []; // funções (ctx, cx, cy, t) desenhadas na camada do chão
    this.extrasFrente = [];
  }

  adicionar(e) {
    this.entidades.push(e);
    return e;
  }

  remover(e) {
    const i = this.entidades.indexOf(e);
    if (i >= 0) this.entidades.splice(i, 1);
  }

  porId(id) {
    return this.entidades.find((e) => e.id === id);
  }

  tile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.larg || ty >= this.alt) return "vazio";
    return this.grade[ty * this.larg + tx];
  }

  solidoTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.larg || ty >= this.alt) return true;
    return this.solidos[ty * this.larg + tx] === 1;
  }

  terrenoEm(px, py) {
    const t = this.tile(Math.floor(px / TILE), Math.floor(py / TILE));
    const mapa = this.def.somPassos?.[t];
    return mapa ?? SOM_TERRENO[t] ?? "pedra";
  }

  colide(c, ignorar) {
    const x0 = Math.floor(c.x / TILE);
    const x1 = Math.floor((c.x + c.w - 0.01) / TILE);
    const y0 = Math.floor(c.y / TILE);
    const y1 = Math.floor((c.y + c.h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidoTile(tx, ty)) return true;
    for (const b of this.bloqueios) if (sobrepoe(c, b)) return true;
    for (const e of this.entidades) {
      if (e === ignorar || !e.solido || !e.visivel) continue;
      const b = e.caixa();
      if (b && sobrepoe(c, b)) return true;
    }
    return false;
  }

  atualizar(dt, jogo) {
    for (const e of this.entidades) e.atualizar(dt, jogo);
    for (const z of this.zonas) {
      if (z.feita && z.umaVez !== false) continue;
      if (z.ativa && !z.ativa(jogo)) continue;
      const j = jogo.jogador;
      const dentro = j.x >= z.x && j.x <= z.x + z.w && j.y >= z.y && j.y <= z.y + z.h;
      if (dentro && !z.dentro) {
        z.dentro = true;
        z.feita = true;
        z.aoEntrar?.(jogo);
      } else if (!dentro) z.dentro = false;
    }
  }

  desenhar(ctx, cx, cy, w, h, t, jogo) {
    // Chão (só a parte visível da imagem grande).
    const sx = Math.max(0, cx);
    const sy = Math.max(0, cy);
    const sw = Math.min(this.L - sx, w - (sx - cx));
    const sh = Math.min(this.A - sy, h - (sy - cy));
    if (sw > 0 && sh > 0) ctx.drawImage(this.chao, sx, sy, sw, sh, sx - cx, sy - cy, sw, sh);
    for (const a of this.aguas) {
      ctx.save();
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      ctx.rect(a.x, a.y, a.w, a.h);
      ctx.clip();
      desenharAgua(ctx, a.x, a.y, a.w, a.h, t, cx, cy, a.cores);
      ctx.restore();
    }
    for (const f of this.extrasDesenho) f(ctx, cx, cy, t, jogo);
    for (const e of this.entidades) if (e.camada === "chao") e.desenhar(ctx, cx, cy, jogo);
    // Entidades ordenadas pela base (quem está mais abaixo fica na frente).
    const lista = this.entidades.filter((e) => e.camada === "mundo" && e.visivel);
    lista.sort((a, b) => a.base - b.base);
    for (const e of lista) {
      if (e.x < cx - 80 || e.x > cx + w + 80 || e.y < cy - 20 || e.y > cy + h + 90) continue;
      e.desenhar(ctx, cx, cy, jogo);
    }
    jogo.particulas.desenhar(ctx, cx, cy, false);
    // Primeiro plano: copas, arcos. Ficam transparentes quando o jogador passa por trás.
    const j = jogo.jogador;
    for (const e of this.entidades) {
      if (e.camada !== "frente" || !e.visivel) continue;
      const img = e.imagemAtual?.() ?? e.img;
      let alvo = 1;
      if (img && j) {
        const ex = e.x - e.ax;
        const ey = e.y - e.ay;
        if (j.x > ex + 4 && j.x < ex + img.width - 4 && j.y - 12 > ey && j.y - 20 < ey + img.height) alvo = 0.42;
      }
      e.alfa += (alvo - e.alfa) * 0.15;
      e.desenhar(ctx, cx, cy, jogo);
    }
    for (const f of this.extrasFrente) f(ctx, cx, cy, t, jogo);
  }
}

function sobrepoe(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
