# Macacada 🐒🍌

Jogo de cartas e blefe com tema de selva, feito com HTML, CSS e JavaScript. Você joga contra dois bots (Zeca e Mona). Vence o último macaco que ainda tiver cartas.

## Como jogar

Cada jogador começa com 2 cartas e 2 🍌. Na sua vez, escolha uma ação:

| Ação | Custo | Efeito | Personagem |
|---|---|---|---|
| Renda | 0 | +1 🍌 | nenhum |
| Ajuda externa | 0 | +2 🍌 | nenhum (o Gorila Rei bloqueia) |
| Taxar | 0 | +3 🍌 | 🦍 Gorila Rei |
| Assassinar | 3 🍌 | o alvo perde uma carta | 🐒 Macaco Ninja (a Mico Condessa bloqueia) |
| Extorquir | 0 | rouba 2 🍌 do alvo | 🐵 Macaco Capitão (Capitão e Embaixador bloqueiam) |
| Trocar cartas | 0 | troca cartas com o baralho | 🦧 Orangotango Embaixador |
| Golpe | 7 🍌 | o alvo perde uma carta, não pode ser bloqueado | nenhum |

Com 10 🍌 ou mais, o Golpe é obrigatório.

Qualquer ação de personagem ou bloqueio pode ser desafiado. Quem erra o desafio perde uma carta. Quem acerta embaralha a carta mostrada e compra outra.

## Chat do jogo 💬

Tudo o que acontece na partida aparece no chat ao lado do tabuleiro (no celular, ele fica abaixo do painel).

- Cada ação, desafio, bloqueio, perda de carta e ganho de banana vira um balão de conversa, com o avatar de quem fez.
- As mensagens dos bots ficam à esquerda e as suas ficam à direita.
- A lateral do balão muda de cor conforme o tipo de evento:
  - amarelo: ação
  - vermelho: desafio
  - azul: bloqueio
  - roxo: carta perdida
  - verde: resultado
- Cada turno começa com um separador "Vez de ...", e eliminações e fim de jogo aparecem em destaque.
- O chat rola sozinho para a mensagem mais nova e é limpo quando uma nova partida começa.

Outras ajudas visuais: o jogador da vez fica com a borda destacada e a etiqueta "na vez", e o painel de decisão pulsa quando está esperando você.
