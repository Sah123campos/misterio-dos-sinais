// As salas do jogo. Cada sala tem:
//   def       — mapa, paleta, luz ambiente, música e posição inicial
//   montar    — cria objetos, personagens, luzes e marcas da luz negra
//   aoEntrar  — cena de abertura (opcional)
//   atualizar — partículas e efeitos contínuos (opcional)
//   desenharPorCima — efeitos sobre a iluminação, como névoa (opcional)
import { titulo } from "./titulo.js";
import { cana } from "./cana.js";
import { poco } from "./poco.js";
import { betesda } from "./betesda.js";

export const SALAS = { titulo, cana, poco, betesda };
