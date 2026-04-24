## Objetivo

Aplicar um sistema de layout consistente e profissional em toda a página `/` (`src/pages/Index.tsx`), seguindo o enquadramento do dcadencebeats.com — vitrine organizada, urbana e de luxo, com cada bloco visual com o mesmo peso.

## Diretrizes de design (tokens globais)

Adicionar utilitário/padrões consistentes:

- **Container**: `max-w-[1400px] mx-auto px-6 md:px-10` em TODAS as seções (hoje varia entre `max-w-2xl`, `max-w-4xl`, `max-w-5xl`, `max-w-6xl` — padronizar).
- **Gap uniforme**: `gap-6` (24px) em todos os grids e listas de cards.
- **Espaçamento vertical entre seções**: `py-20 md:py-24` em todas (já consistente em parte; padronizar).
- **Aspect ratios fixos**:
  - Hero vídeo: `aspect-video` (16:9) — já existe ✅
  - Cards de prova social (imagens): `aspect-square` (1:1) com `object-cover` (hoje usa `h-72` que distorce conforme largura).
- **Tipografia hierárquica**:
  - H1 (hero): `text-5xl sm:text-7xl md:text-8xl font-black` ✅
  - H2 (seções): padronizar em `text-4xl md:text-5xl font-black tracking-tight`
  - Body: `text-base text-muted-foreground leading-relaxed`
  - Texto secundário: `text-sm text-muted-foreground`

## Mudanças por seção

### 1. Hero
- Trocar `max-w-5xl` por container padrão `max-w-[1400px]`.
- Manter vídeo em `max-w-2xl mx-auto` com `aspect-video` (foco central, igual referência).

### 2. Avaliações do pack (`#avaliacoes`)
- Container `max-w-[1400px]`.
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Cards de imagem: substituir `h-72 object-cover` por wrapper com `aspect-square` + `<img class="w-full h-full object-cover">` — todas as fotos do mesmo tamanho, sem distorção, encaixadas perfeitamente.
- Cards de texto (fallback testimonials) seguem mesma grid.

### 3. Stats
- Container `max-w-[1400px]`.
- Grid: `grid-cols-2 md:grid-cols-4 gap-6` ✅ (apenas alinhar container).

### 4. Features ("O que vem no pack")
- Container `max-w-[1400px]`.
- Grid: `grid-cols-1 md:grid-cols-2 gap-6` (hoje `sm:grid-cols-2 gap-4` → subir breakpoint p/ md, gap 24px).

### 5. Beats preview
- Container `max-w-[1400px]` com inner `max-w-4xl` para a lista (players são linhas longas, mantém legibilidade).
- Espaçamento entre players: `space-y-4` (16px) — exceção justificada para listas verticais densas.

### 6. CTA final ("Pack de 100 Beats")
- Container `max-w-[1400px]` com card interno `max-w-2xl mx-auto` (mantém destaque visual).

### 7. FAQ
- Container `max-w-[1400px]` com inner `max-w-3xl` (legibilidade de texto).

## Responsividade (padding lateral idêntico)

- Mobile: `px-6` (24px) em TODAS as seções.
- Tablet/Desktop: `md:px-10` (40px).
- Garante respiro idêntico em qualquer tela; nada encosta nas bordas.

Breakpoints de colunas:
| Seção | Mobile | Tablet (sm) | Desktop (lg) |
|---|---|---|---|
| Avaliações | 1 col | 2 col | 3 col |
| Stats | 2 col | — | 4 col |
| Features | 1 col | — | 2 col (md) |
| Genres badges | flex-wrap | flex-wrap | flex-wrap |

## Detalhes técnicos

Arquivo único alterado: `src/pages/Index.tsx`.

1. Criar uma constante de classe `const CONTAINER = "mx-auto w-full max-w-[1400px] px-6 md:px-10"` no topo do componente para reutilizar.
2. Aplicar `CONTAINER` em todas as 7 `<section>`.
3. Substituir, no bloco de avaliações:
   ```tsx
   <Card className="overflow-hidden border-border/60 bg-background">
     <div className="aspect-square">
       <img src={src} className="w-full h-full object-cover" />
     </div>
   </Card>
   ```
4. Padronizar grid de avaliações para `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
5. Padronizar grid de features para `grid-cols-1 md:grid-cols-2 gap-6`.
6. Padronizar todas seções para `py-20 md:py-24`.

Nenhuma mudança em `src/styles.css`, design tokens, cores ou fontes — apenas estrutura de layout/grid. Animações existentes (bounce do "veja avaliações", fade-in) são preservadas.

## Resultado esperado

Vitrine alinhada: imagens de prova social todas quadradas e do mesmo tamanho, cards de features com mesmo peso visual, todas as seções com a mesma largura máxima (1400px) e mesmo respiro lateral em mobile/desktop, gap uniforme de 24px em toda a página.
