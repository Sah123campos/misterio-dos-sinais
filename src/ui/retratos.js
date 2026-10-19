// Retratos dos diálogos.
// Personagens com foto (os cinco amigos) usam a foto real, levemente
// pixelada para combinar com o jogo. Os demais usam um busto em pixel art.
import { ELENCO } from "../dados/elenco.js";
import { gerarFolha, gerarRetratoSprite } from "../arte/personagens.js";
import { criarCanvas } from "../arte/pixel.js";

// "pixel": foto reduzida para 80x80 e ampliada (combina com o jogo).
// "foto": foto nítida, sem pixelar.
export const ESTILO_RETRATO = "pixel";
const RESOLUCAO_PIXEL = 80;

const folhas = new Map();
const retratos = new Map();

export function folhaDe(id) {
  if (!folhas.has(id)) folhas.set(id, gerarFolha(ELENCO[id].sprite));
  return folhas.get(id);
}

function carregarImagem(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

function recortarFoto(img) {
  const n = ESTILO_RETRATO === "pixel" ? RESOLUCAO_PIXEL : 256;
  const c = criarCanvas(n, n);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Recorte quadrado, puxado para cima (onde normalmente fica o rosto).
  const lado = Math.min(img.width, img.height);
  const sx = (img.width - lado) / 2;
  const sy = img.height > img.width ? (img.height - lado) * 0.18 : 0;
  ctx.drawImage(img, sx, sy, lado, lado, 0, 0, n, n);
  if (ESTILO_RETRATO === "pixel") {
    // Leve ajuste de contraste e calor, como uma foto antiga iluminada por lamparina.
    const dados = ctx.getImageData(0, 0, n, n);
    const d = dados.data;
    for (let i = 0; i < d.length; i += 4) {
      for (let k = 0; k < 3; k++) {
        let v = d[i + k] / 255;
        v = (v - 0.5) * 1.08 + 0.5;
        v = Math.round(Math.max(0, Math.min(1, v)) * 31) / 31; // menos tons = mais "pixel"
        d[i + k] = v * 255;
      }
      d[i] = Math.min(255, d[i] * 1.04);
      d[i + 2] = d[i + 2] * 0.94;
    }
    ctx.putImageData(dados, 0, 0);
  }
  c.dataset.estilo = ESTILO_RETRATO;
  return c;
}

export async function carregarRetratos(aoProgredir) {
  const ids = Object.keys(ELENCO);
  let feitos = 0;
  await Promise.all(
    ids.map(async (id) => {
      const p = ELENCO[id];
      let retrato = null;
      if (p.foto) {
        const img = await carregarImagem(p.foto);
        if (img) retrato = recortarFoto(img);
      }
      if (!retrato) retrato = gerarRetratoSprite(folhaDe(id), p.brilho);
      retratos.set(id, retrato);
      feitos++;
      aoProgredir?.(feitos / ids.length);
    }),
  );
}

export function retratoDe(id) {
  return retratos.get(id) ?? null;
}
