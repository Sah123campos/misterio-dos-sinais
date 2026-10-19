# O Mistério dos Sinais

RPG 2D em pixel art de suspense e investigação, baseado nos sinais do Evangelho de João.
Roda direto no navegador (computador e celular), sem instalar nada. Dura cerca de 10 minutos.

1. **Bodas de Caná** (João 2:1–11): encher as seis talhas, ver a água virar vinho, achar a luz negra na adega e abrir o portão.
2. **Poço de Jacó** (João 4:1–42): ouvir Jesus e a samaritana, revelar a gota no cântaro e abrir a porta de pedra da gruta.
3. **Tanque de Betesda** (João 5:1–13): ver a cura do homem doente havia 38 anos, tocar as colunas na ordem certa e revelar a mensagem final.

No fim, o botão **CONTINUAR A INVESTIGAÇÃO** abre a inscrição do Acampadentro.

## Como jogar

| Ação | Computador | Celular |
|---|---|---|
| Andar | WASD ou setas | joystick (toque no lado esquerdo) |
| Interagir / avançar diálogo | E, Espaço ou Enter | botão grande à direita / tocar na caixa |
| Lanterna | F | botão da lanterna |
| Luz negra (depois de recebida) | Q | botão roxo |
| Diário | J | botão do diário |
| Pausa | Esc ou P | botão de pausa |
| Som | M | botão de som |

## Rodar no computador

O jogo usa módulos JavaScript, então precisa de um servidor simples (abrir o `index.html` direto não funciona):

```bash
cd ~/misterio-dos-sinais
python3 -m http.server 8770
```

Depois abra `http://127.0.0.1:8770/`.

Para testar uma sala específica: `http://127.0.0.1:8770/?debug&sala=poco` (ou `sala=betesda`).

## Publicar

Qualquer hospedagem de arquivos estáticos serve (GitHub Pages, Netlify, Cloudflare Pages). É só enviar a pasta inteira.

## Trocar recursos

| O quê | Onde |
|---|---|
| **Fotos dos retratos** | `assets/retratos/` — substitua o arquivo mantendo o nome (`debora.jpg`, `kenedy.jpg`, `bea.jpg`, `mj.jpg`, `thama.jpg`, `samuel.jpg`). Recorte quadrado, centrado no rosto; 256×256 basta. |
| Aparência dos personagens no cenário | `src/dados/elenco.js` (cor de pele, cabelo, roupa, óculos, boné, barba) |
| Todos os textos e diálogos | `src/dados/dialogos.js` |
| Roteiro, mapa e objetos de cada sala | `src/salas/cana.js`, `src/salas/poco.js`, `src/salas/betesda.js` |
| Músicas | `src/audio/musicas.js` (compostas em código) |
| Efeitos sonoros | `src/audio/efeitos.js` (sintetizados em código) |
| Link do Acampadentro | `src/config.js` (`LINK_ACAMPADENTRO`) |

Para ver os sprites ampliados: `http://127.0.0.1:8770/ferramentas/galeria.html`.

### Sobre o áudio

Não há arquivos de áudio: todas as músicas e efeitos são gerados no navegador, então o jogo não depende de nada externo.
Para usar gravações, troque a função do efeito em `src/audio/efeitos.js` por uma que toque o arquivo.
As falas em voz alta usam a voz do próprio aparelho (opção **Vozes** no menu de pausa), quando disponível.

## Organização

```
index.html            camadas da interface
css/estilo.css        interface em pixel art
assets/               fonte, ícone e fotos dos retratos
src/main.js           início, tela título e laço do jogo
src/jogo.js           núcleo: salas, lanterna, luz negra, cenas
src/motor/            tela, entrada, mundo, entidades, luz, partículas
src/arte/             pixel art gerada por código (personagens, cenários, objetos, símbolos)
src/ui/               diálogo, diário, enigmas, controles de toque, retratos
src/audio/            motor de áudio, músicas e efeitos
src/salas/            as três salas e o cenário da tela título
src/dados/            elenco e diálogos
```

As marcas escondidas e o mistério são ficção do jogo. Os acontecimentos bíblicos seguem o relato do Evangelho de João, com a referência de cada passagem.
