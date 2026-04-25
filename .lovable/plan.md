# Checkout próprio estilo Pague-Certo

Criar uma página `/checkout` no seu próprio site com o mesmo layout da referência: dados do cliente à esquerda, resumo do pedido à direita, oferta especial (order bump) e seleção de forma de pagamento (Pix + Cartão).

## Provedor de pagamento

Vou usar o **Stripe (Pagamentos integrados da Lovable)** porque:
- Não precisa criar conta nem chave de API para começar a testar
- Suporta **Pix** e **cartão de crédito** no Brasil
- Lovable já cuida de webhook, ambiente de teste e produção

> Observação: o Stripe Pix funciona nativo. Se você preferir Mercado Pago (mais comum no Brasil para Pix), me avise antes — ele exige conta própria e chave.

## Fluxo do usuário

```text
Index (botão "GARANTIR MEU PACK")
   │
   ▼
/checkout  (página nova)
   ├─ Email
   ├─ Order bump opcional (+R$ 6,90)
   ├─ Pix  ou  Cartão
   └─ [Comprar Agora]
        │
        ▼
   Stripe Checkout Session  →  pagamento
        │
        ▼
/obrigado?session_id=...
   └─ Mostra link de download do pack + envia email
```

## O que vou construir

### 1. Página de checkout (`/checkout`)
Layout 2 colunas (mobile: empilha):
- **Coluna esquerda**: Card "Dados Pessoais" (email), Card "Oferta Especial" (order bump clicável), Card "Forma de Pagamento" (Pix / Cartão), botão verde "Comprar Agora"
- **Coluna direita** (sticky): "Resumo do Pedido" com produto, preço riscado R$ 119,90 → R$ 19,90, total dinâmico (atualiza se marcar o bump)

### 2. Página de obrigado (`/obrigado`)
- Confirma a compra consultando o `session_id`
- Mostra link de download do pack
- Mensagem "também enviamos por email"

### 3. Backend (Lovable Cloud)
- **Tabela `products`**: pack principal + order bump (nome, preço, descrição, imagem, link de download)
- **Tabela `orders`**: registra cada pedido (email, itens, status, stripe_session_id, link entregue)
- **Edge function `create-checkout`**: cria a Stripe Checkout Session com os itens selecionados
- **Edge function `stripe-webhook`**: recebe confirmação de pagamento, marca pedido como pago, envia email com link
- **Edge function `verify-payment`**: usada pela página `/obrigado` para confirmar e mostrar link

### 4. Email automático
Email transacional com o link de download do pack assim que o pagamento é confirmado (via Resend, já incluso no Lovable Cloud).

### 5. Atualização no Index
O botão "GARANTIR MEU PACK" passa a redirecionar para `/checkout` em vez do link externo atual.

## Detalhes técnicos

- Página criada como rota React Router em `src/pages/Checkout.tsx` e `src/pages/Obrigado.tsx`, registradas em `src/main.tsx` (mantendo o padrão atual do projeto, sem TanStack Start)
- Stripe Checkout Session com `payment_method_types: ['card', 'pix']`, `currency: 'brl'`
- Order bump é um segundo line_item adicionado dinamicamente quando o checkbox está marcado
- Tabela `orders` com RLS: insert público (criação do pedido), select só pelo próprio email/session_id
- Webhook valida assinatura do Stripe antes de gravar
- Email enviado via Resend com template simples (nome do produto + link)

## O que vou pedir antes de implementar

1. **Habilitar Pagamentos da Lovable (Stripe)** — clique único no botão de aprovação que vou disparar
2. **Link de download do pack** (Google Drive, Dropbox, etc.) — para entregar ao cliente
3. **Order bump**: quer manter "10 Beats de BOOMBAP por R$ 6,90" como na referência, ou outro produto/preço?

## Fora do escopo (posso adicionar depois)
- Boleto bancário
- Cupons de desconto
- Recuperação de carrinho abandonado
- Upsell pós-compra
