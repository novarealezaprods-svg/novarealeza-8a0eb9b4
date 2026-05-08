## Objetivo
Adicionar um pop-up que aparece quando o cliente clica em qualquer botão de checkout (Pack Suprema R$19,90 e Pack Supremo R$27,90), avisando que o acesso é entregue **instantaneamente no WhatsApp e no Gmail**, e pedindo que ele informe os dados corretamente antes de prosseguir para o pagamento.

## Comportamento

1. Ao clicar em "Comprar / Quero meu pack", em vez de redirecionar direto pro checkout:
   - Abre um modal centralizado (Dialog do shadcn).
   - Cliente lê o aviso e clica em "Continuar para o pagamento" → redireciona ao link do checkout original.
   - Botão secundário "Cancelar" fecha o modal.
2. O modal funciona tanto para o Pack 19,90 quanto para o Pack 27,90 (mesma lógica, mesmo componente — só muda a URL de destino guardada em estado).
3. Mantém os eventos `dataLayer` (AddToCart) que já existem em `handleCheckout`.

## Conteúdo do pop-up (copy curto + SEO)

- **Título (h2):** "Acesso instantâneo no seu WhatsApp e Gmail"
- **Subtítulo:** "Assim que o pagamento for aprovado, você recebe o pack na hora."
- **Bloco de atenção (destaque amarelo/âmbar):**
  - Ícone de alerta + texto:
  - "⚠️ Informe seu **WhatsApp** e **e-mail Gmail** corretamente no checkout. A entrega é automática — dados errados = você não recebe o pack."
- **Lista rápida (3 itens com ícones):**
  - 📱 WhatsApp com DDD correto
  - 📧 E-mail Gmail ativo
  - ⚡ Entrega em segundos após aprovação
- **CTA primário (verde, grande):** "Continuar para o pagamento"
- **CTA secundário (ghost):** "Voltar"

## SEO / Acessibilidade

- `<DialogTitle>` semântico para o título.
- `<DialogDescription>` com a frase do subtítulo (descrição acessível, lida por screen readers e indexada).
- Botões com `aria-label` claros.
- Texto em português, palavras-chave naturais: "acesso instantâneo", "pack de beats", "entrega automática", "WhatsApp", "Gmail".
- Sem alterar o `<head>` da página — apenas conteúdo do modal.

## Arquivos afetados

- **`src/pages/Index.tsx`** (único arquivo):
  - Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` de `@/components/ui/dialog`.
  - Importar ícones `MessageCircle`, `Mail`, `Zap`, `AlertTriangle` de `lucide-react`.
  - Novo estado: `const [deliveryModal, setDeliveryModal] = useState<{open: boolean; url: string}>({open:false, url:""})`.
  - Refatorar `handleCheckout(url)` para abrir o modal em vez de redirecionar direto. Criar `confirmCheckout()` que dispara o `dataLayer.push` e faz `window.location.href = deliveryModal.url`.
  - Renderizar o `<Dialog>` no fim do JSX.

Sem mudanças em backend, banco ou rotas.
