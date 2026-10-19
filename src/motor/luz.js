// Iluminação em pixel art.
// 1) Uma camada de escuridão em meia resolução recebe "furos" de luz
//    (tochas, lanterna, sol) e é pontilhada com a matriz de Bayer, o que dá
//    o degradê em degraus típico de pixel art.
// 2) Brilhos coloridos são somados por cima (fogo laranja, luz negra roxa).
// 3) A luz negra revela inscrições escondidas só dentro do feixe.
import { criarCanvas, BAYER4 } from "../arte/pixel.js";

const NIVEIS = 7;
const COR_ESCURO = [7, 5, 18];

export class Iluminacao {
  constructor() {
    this.cv = criarCanvas(8, 8);
    this.ctx = this.cv.getContext("2d", { willReadFrequently: true });
    this.mascara = criarCanvas(8, 8);
    this.mctx = this.mascara.getContext("2d");
    this.lw = 8;
    this.lh = 8;
  }

  redimensionar(w, h) {
    this.lw = Math.ceil(w / 2) + 2;
    this.lh = Math.ceil(h / 2) + 2;
    this.cv.width = this.lw;
    this.cv.height = this.lh;
    this.mascara.width = w;
    this.mascara.height = h;
  }

  // Fator (0..1) de quanto um ponto está iluminado pelo feixe da lanterna.
  static fatorFeixe(j, px, py, alcance = 124, abertura = 0.5) {
    const ox = j.x;
    const oy = j.y - 10;
    const dx = px - ox;
    const dy = py - oy;
    const d = Math.hypot(dx, dy);
    if (d < 14) return 1;
    if (d > alcance) return 0;
    let da = Math.atan2(dy, dx) - j.angulo;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const ang = Math.abs(da);
    if (ang > abertura + 0.12) return 0;
    const fAng = ang < abertura - 0.1 ? 1 : 1 - (ang - (abertura - 0.1)) / 0.22;
    const fDist = d < alcance * 0.65 ? 1 : 1 - (d - alcance * 0.65) / (alcance * 0.35);
    return Math.max(0, Math.min(1, fAng * fDist));
  }

  desenhar(ctx, jogo, cx, cy, w, h, t) {
    const amb = jogo.escuridao;
    const mundo = jogo.mundo;
    const j = jogo.jogador;
    const modo = jogo.lanterna; // "desligada" | "normal" | "uv"
    const L = this.ctx;
    const ox = Math.floor(cx / 2);
    const oy = Math.floor(cy / 2);
    const desloc = (wx) => wx / 2 - ox;
    const deslocY = (wy) => wy / 2 - oy;

    const temEscuro = amb > 0.01 || mundo.def.sombras?.length;
    if (temEscuro) {
      L.globalCompositeOperation = "source-over";
      L.clearRect(0, 0, this.lw, this.lh);
      L.fillStyle = `rgba(0,0,0,${amb})`;
      L.fillRect(0, 0, this.lw, this.lh);
      // Zonas de sombra (grutas, cantos escuros), com borda suave.
      const zonas = mundo.def.sombras || [];
      for (const s of zonas) if (!s.fechada) this.zonaSombra(L, s, desloc, deslocY);
      // Furos de luz.
      L.globalCompositeOperation = "destination-out";
      for (const luz of mundo.luzes) {
        if (luz.ativa === false) continue;
        const lx = luz.alvo ? luz.alvo.x + (luz.ox ?? 0) : luz.x;
        const ly = luz.alvo ? luz.alvo.y + (luz.oy ?? 0) : luz.y;
        if (lx < cx - 200 || lx > cx + w + 200 || ly < cy - 200 || ly > cy + h + 200) continue;
        const tremor = luz.tremor ? 1 + Math.sin(t * 9 + lx) * 0.04 * luz.tremor + Math.sin(t * 23 + ly) * 0.03 * luz.tremor : 1;
        const r = (luz.raio * tremor) / 2;
        const px = desloc(lx);
        const py = deslocY(ly);
        const g = L.createRadialGradient(px, py, 0, px, py, r);
        const i = luz.intensidade ?? 1;
        g.addColorStop(0, `rgba(0,0,0,${i})`);
        g.addColorStop(0.55, `rgba(0,0,0,${i * 0.7})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        L.fillStyle = g;
        L.fillRect(px - r, py - r, r * 2, r * 2);
      }
      // Lugares fechados (adega, gruta): a luz de fora não entra, só a lanterna.
      L.globalCompositeOperation = "source-over";
      for (const s of zonas) if (s.fechada) this.zonaSombra(L, s, desloc, deslocY);
      L.globalCompositeOperation = "destination-out";
      if (j) this.furoLanterna(L, j, modo, desloc, deslocY);
      this.pontilhar(ox, oy);
      ctx.drawImage(this.cv, -(cx - ox * 2), -(cy - oy * 2), this.lw * 2, this.lh * 2);
    }

    // Brilhos coloridos somados.
    ctx.globalCompositeOperation = "lighter";
    for (const luz of mundo.luzes) {
      if (luz.ativa === false || !luz.cor) continue;
      const lx = (luz.alvo ? luz.alvo.x + (luz.ox ?? 0) : luz.x) - cx;
      const ly = (luz.alvo ? luz.alvo.y + (luz.oy ?? 0) : luz.y) - cy;
      if (lx < -150 || lx > w + 150 || ly < -150 || ly > h + 150) continue;
      const tremor = luz.tremor ? 1 + Math.sin(t * 11 + lx) * 0.06 * luz.tremor : 1;
      const r = luz.raio * 0.75 * tremor;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      const [cr, cg, cb] = luz.cor;
      const a = (luz.brilho ?? 0.2) * Math.min(1, 0.4 + amb);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
    if (j && modo !== "desligada") this.brilhoLanterna(ctx, j, modo, cx, cy, amb);
    ctx.globalCompositeOperation = "source-over";

    // Inscrições da luz negra.
    if (j && modo === "uv") this.desenharUV(ctx, jogo, cx, cy, w, h, t);
  }

  // Zona escura (gruta, adega) com borda em degradê nos quatro lados.
  zonaSombra(L, s, desloc, deslocY) {
    const x = desloc(s.x * 16);
    const y = deslocY(s.y * 16);
    const sw = (s.w * 16) / 2;
    const sh = (s.h * 16) / 2;
    if (x > this.lw || y > this.lh || x + sw < 0 || y + sh < 0) return;
    const b = Math.max(1, Math.min((s.borda ?? 12) / 2, sw / 2, sh / 2));
    const f = Math.min(1, s.forca ?? 0.85);
    const cheio = `rgba(0,0,0,${f})`;
    const vazio = "rgba(0,0,0,0)";
    L.fillStyle = cheio;
    L.fillRect(x + b, y + b, sw - 2 * b, sh - 2 * b);
    const lado = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = L.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, vazio);
      g.addColorStop(1, cheio);
      L.fillStyle = g;
      L.fillRect(rx, ry, rw, rh);
    };
    lado(x, 0, x + b, 0, x, y + b, b, sh - 2 * b);
    lado(x + sw, 0, x + sw - b, 0, x + sw - b, y + b, b, sh - 2 * b);
    lado(0, y, 0, y + b, x + b, y, sw - 2 * b, b);
    lado(0, y + sh, 0, y + sh - b, x + b, y + sh - b, sw - 2 * b, b);
    for (const [cx, cy, rx, ry] of [
      [x + b, y + b, x, y],
      [x + sw - b, y + b, x + sw - b, y],
      [x + b, y + sh - b, x, y + sh - b],
      [x + sw - b, y + sh - b, x + sw - b, y + sh - b],
    ]) {
      const g = L.createRadialGradient(cx, cy, 0, cx, cy, b);
      g.addColorStop(0, cheio);
      g.addColorStop(1, vazio);
      L.fillStyle = g;
      L.fillRect(rx, ry, b, b);
    }
  }

  furoLanterna(L, j, modo, desloc, deslocY) {
    const ox = desloc(j.x);
    const oy = deslocY(j.y - 10);
    if (modo === "desligada") {
      const r = 13;
      const g = L.createRadialGradient(ox, oy, 0, ox, oy, r);
      g.addColorStop(0, "rgba(0,0,0,0.42)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      L.fillStyle = g;
      L.fillRect(ox - r, oy - r, r * 2, r * 2);
      return;
    }
    const forca = modo === "uv" ? 0.62 : 1;
    // halo em volta do personagem
    const r0 = 16;
    const g0 = L.createRadialGradient(ox, oy, 0, ox, oy, r0);
    g0.addColorStop(0, `rgba(0,0,0,${0.9 * forca})`);
    g0.addColorStop(1, "rgba(0,0,0,0)");
    L.fillStyle = g0;
    L.fillRect(ox - r0, oy - r0, r0 * 2, r0 * 2);
    // feixe em cone (três camadas para a borda ficar suave)
    const alcance = 62;
    for (const [abertura, alfa] of [[0.62, 0.35], [0.5, 0.45], [0.38, 0.5]]) {
      const g = L.createRadialGradient(ox, oy, 2, ox, oy, alcance);
      g.addColorStop(0, `rgba(0,0,0,${alfa * forca})`);
      g.addColorStop(0.65, `rgba(0,0,0,${alfa * 0.8 * forca})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      L.fillStyle = g;
      L.beginPath();
      L.moveTo(ox, oy);
      L.arc(ox, oy, alcance, j.angulo - abertura, j.angulo + abertura);
      L.closePath();
      L.fill();
    }
  }

  brilhoLanterna(ctx, j, modo, cx, cy, amb) {
    const ox = j.x - cx;
    const oy = j.y - 10 - cy;
    const alcance = 124;
    const cor = modo === "uv" ? [150, 70, 255] : [255, 236, 190];
    const a = modo === "uv" ? 0.2 : 0.07 * Math.min(1, amb + 0.3);
    const g = ctx.createRadialGradient(ox, oy, 4, ox, oy, alcance);
    g.addColorStop(0, `rgba(${cor[0]},${cor[1]},${cor[2]},${a})`);
    g.addColorStop(1, `rgba(${cor[0]},${cor[1]},${cor[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, alcance, j.angulo - 0.5, j.angulo + 0.5);
    ctx.closePath();
    ctx.fill();
  }

  desenharUV(ctx, jogo, cx, cy, w, h, t) {
    const m = this.mctx;
    const j = jogo.jogador;
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, w, h);
    let algum = false;
    for (const ins of jogo.mundo.uv) {
      if (ins.ativa && !ins.ativa(jogo)) continue;
      const x = Math.round(ins.x - cx);
      const y = Math.round(ins.y - cy);
      if (x < -ins.img.width || y < -ins.img.height || x > w || y > h) continue;
      const pulso = 0.85 + Math.sin(t * 3 + ins.x) * 0.15;
      m.globalAlpha = pulso;
      m.drawImage(ins.img, x - Math.floor(ins.img.width / 2), y - Math.floor(ins.img.height / 2));
      algum = true;
    }
    m.globalAlpha = 1;
    if (!algum) return;
    // Recorta pelo formato do feixe.
    m.globalCompositeOperation = "destination-in";
    const ox = j.x - cx;
    const oy = j.y - 10 - cy;
    const g = m.createRadialGradient(ox, oy, 6, ox, oy, 124);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.7, "rgba(0,0,0,0.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = g;
    m.beginPath();
    m.moveTo(ox, oy);
    m.arc(ox, oy, 124, j.angulo - 0.56, j.angulo + 0.56);
    m.closePath();
    m.fill();
    m.globalCompositeOperation = "source-over";
    ctx.drawImage(this.mascara, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    ctx.drawImage(this.mascara, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  // Pontilhado ordenado: transforma o degradê suave em degraus de pixel art.
  pontilhar(ox, oy) {
    const img = this.ctx.getImageData(0, 0, this.lw, this.lh);
    const d = img.data;
    const lw = this.lw;
    for (let y = 0; y < this.lh; y++) {
      const by = ((y + oy) & 3) * 4;
      for (let x = 0; x < lw; x++) {
        const i = (y * lw + x) * 4;
        const a = d[i + 3] / 255;
        const v = Math.floor(a * NIVEIS + BAYER4[by + ((x + ox) & 3)] - 0.5 + 0.5);
        const q = Math.max(0, Math.min(NIVEIS, v)) / NIVEIS;
        d[i] = COR_ESCURO[0];
        d[i + 1] = COR_ESCURO[1];
        d[i + 2] = COR_ESCURO[2];
        d[i + 3] = q * 255;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  }
}
