## Problema

A Vercel ainda mostra o logo antigo na aba do navegador. Dois motivos prováveis:
1. O favicon que gerei antes era um desenho genérico (coroa + nota), não o logo real do leão "Nova Realeza" que aparece no site.
2. Navegadores fazem cache agressivo de favicon — mesmo após republicar, o ícone antigo continua preso.

## Solução

### 1. Usar o logo real da marca como favicon
- Localizar a imagem do logo "Nova Realeza" (leão dourado) já usada no hero do site.
- Gerar um novo `public/favicon.png` em 512x512 baseado nesse logo, com fundo transparente/escuro pra ficar nítido na aba.
- Também gerar versões otimizadas: `favicon-32.png` e `favicon-16.png` pra tamanhos pequenos ficarem legíveis.

### 2. Cache busting no `index.html`
Adicionar query string de versão nos links do favicon pra forçar o navegador a baixar o novo:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
<link rel="icon" type="image/png" sizes="512x512" href="/favicon.png?v=3" />
<link rel="apple-touch-icon" sizes="180x180" href="/favicon.png?v=3" />
```

### 3. Republicação
Após aplicar, você precisa clicar em **Publish → Update** no Lovable pra mudança ir pro `novarealeza.lovable.app`. Se o domínio na Vercel é via deploy do GitHub, o push acontece automático.

## O que NÃO vou fazer

- Não vou mexer em nada do admin, beats ou banco.
- Não vou trocar o logo do hero — só o favicon (ícone da aba).

## Resultado esperado

Aba do navegador mostra o leão dourado da Nova Realeza em vez do desenho genérico (ou do antigo placeholder do Lovable).
