// Partículas pixeladas: poeira na luz, fagulhas, folhas, vaga-lumes, gotas e brilhos.
// "emissivas" brilham no escuro (desenhadas depois da iluminação).

export class Particulas {
  constructor() {
    this.lista = [];
    this.max = 420;
  }

  limpar() {
    this.lista.length = 0;
  }

  emitir(p) {
    if (this.lista.length >= this.max) this.lista.shift();
    this.lista.push({
      x: p.x,
      y: p.y,
      vx: p.vx ?? 0,
      vy: p.vy ?? 0,
      ax: p.ax ?? 0,
      ay: p.ay ?? 0,
      vida: p.vida ?? 1,
      total: p.vida ?? 1,
      cor: p.cor ?? "#fff",
      cor2: p.cor2 ?? null,
      tam: p.tam ?? 1,
      emissiva: p.emissiva ?? false,
      tipo: p.tipo ?? "ponto",
      fase: p.fase ?? Math.random() * 6.28,
      atrito: p.atrito ?? 0,
    });
  }

  explosao(x, y, n, opcoes) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (opcoes.velocidade ?? 30) * (0.4 + Math.random() * 0.6);
      this.emitir({
        ...opcoes,
        x: x + (Math.random() - 0.5) * (opcoes.espalhar ?? 4),
        y: y + (Math.random() - 0.5) * (opcoes.espalhar ?? 4),
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - (opcoes.subir ?? 0),
        vida: (opcoes.vida ?? 1) * (0.6 + Math.random() * 0.6),
      });
    }
  }

  atualizar(dt) {
    const l = this.lista;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.vida -= dt;
      if (p.vida <= 0) {
        l.splice(i, 1);
        continue;
      }
      p.vx += p.ax * dt;
      p.vy += p.ay * dt;
      if (p.atrito) {
        p.vx *= 1 - p.atrito * dt;
        p.vy *= 1 - p.atrito * dt;
      }
      if (p.tipo === "folha") p.vx += Math.sin(p.fase + p.vida * 3) * 14 * dt;
      if (p.tipo === "vagalume") {
        p.vx += Math.sin(p.fase + p.vida * 1.7) * 10 * dt;
        p.vy += Math.cos(p.fase * 1.3 + p.vida * 1.1) * 10 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  desenhar(ctx, cx, cy, emissivas) {
    for (const p of this.lista) {
      if (p.emissiva !== emissivas) continue;
      const x = Math.round(p.x - cx);
      const y = Math.round(p.y - cy);
      const t = p.vida / p.total;
      let alfa = Math.min(1, t * 3);
      if (p.tipo === "vagalume") alfa *= 0.5 + 0.5 * Math.sin(p.fase + p.vida * 4);
      if (alfa <= 0.02) continue;
      ctx.globalAlpha = alfa;
      ctx.fillStyle = p.cor2 && t < 0.5 ? p.cor2 : p.cor;
      if (p.tipo === "brilho") {
        // estrelinha em cruz
        ctx.fillRect(x, y, 1, 1);
        if (t > 0.4) {
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        }
      } else if (p.tipo === "folha") {
        ctx.fillRect(x, y, 2, 1);
      } else {
        ctx.fillRect(x, y, p.tam, p.tam);
      }
    }
    ctx.globalAlpha = 1;
  }
}
