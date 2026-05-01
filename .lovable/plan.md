## O que vai melhorar

O bloco abaixo do vídeo (checks verdes + botão + microcopy de segurança) hoje parece "jogado": texto solto sobre o fundo, botão chapado, cadeado no emoji. Vou elevar com hierarquia, profundidade e ritmo.

## Mudanças

### 1. Checks verdes — viram "chips" com ícone real
- Trocar o caractere `✓` por ícone `Check` do lucide dentro de um círculo verde sólido (badge 18×18).
- Cada chip ganha fundo verde translúcido (`rgba(57,255,20,0.08)`), borda 1px verde sutil, padding `6px 12px`, border-radius full.
- Texto em branco puro (não verde), peso 700, 13px mobile / 14px desktop. O verde fica concentrado no badge — leitura mais limpa.
- Animação: cada chip entra com fade + slide de 8px da esquerda, delay sequencial 150ms.
- Mobile: empilhados com gap 8px. Desktop: em linha com gap 10px (sem o `·` separador, que vira ruído com chips).

### 2. Botão de compra — profundidade real
- Background: gradiente vertical sutil do verde principal para um tom 6% mais escuro (dá volume sem mudar a cor base).
- Sombra dupla: glow externo verde pulsante (mantido) + sombra inferior preta `0 8px 24px rgba(0,0,0,0.5)` para "levantar" o botão.
- Borda interna brilhante (`inset 0 1px 0 rgba(255,255,255,0.25)`) que simula luz no topo.
- Ícone do cadeado em `lucide` (não emoji), preto, 16px, com peso de traço maior.
- Hover: além do `scale(1.04)` + `brightness(1.15)`, adicionar um "shine" (faixa branca diagonal translúcida que atravessa o botão da esquerda à direita em 600ms).
- A seta `→` continua deslizando 5px no hover.

### 3. Microcopy de segurança — legível e estruturada
- Trocar o emoji 🔒 por ícone `Lock` do lucide (12px, cinza claro `#888`), alinhado verticalmente com o texto.
- Separadores `·` em verde sutil (`rgba(57,255,20,0.4)`) em vez de cinza — cria fio condutor com os chips acima.
- Cor do texto: subir de `#666` para `#999` para legibilidade real sem competir com o botão.
- Em mobile: permitir quebra; em desktop: linha única com `flex` e `gap: 8px`.

## Arquivos afetados

- `src/pages/Index.tsx` — refatorar o markup dos checks, botão e microcopy (importar `Check` e `Lock` já estão disponíveis).
- `src/styles.css` — atualizar `.hero-checks`, `.hero-check*`, `.hero-cta*`, `.hero-cta-sub*` e adicionar `@keyframes hero-cta-shine`.

Nada fora do bloco do hero será tocado. Animações existentes (pulso do botão, fade-in dos chips) são mantidas, só refinadas.

## Dica grátis

Para ajustes visuais pequenos como cor de texto, tamanho de fonte ou troca de palavras, você pode usar **Visual Edits** (botão de edição no canto inferior esquerdo do chat) — é instantâneo e não consome créditos.
