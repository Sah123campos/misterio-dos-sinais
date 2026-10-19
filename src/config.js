// Configurações gerais do jogo.
export const TILE = 16;

// Altura aproximada da tela "interna" em pixels de arte. A imagem é ampliada
// por um fator inteiro para os pixels ficarem nítidos em qualquer tela.
export const ALTURA_ALVO = 216;

export const VELOCIDADE_JOGADOR = 74; // pixels de arte por segundo

export const LINK_ACAMPADENTRO = "https://form.jotform.com/jovenseadoles5/inscrio-acampadentro";

const params = new URLSearchParams(location.search);
export const DEBUG = params.has("debug");
// ?sala=poco ou ?sala=betesda pula direto para uma sala (para testes).
export const SALA_INICIAL = params.get("sala");
