## Diagnóstico

A mensagem que aparece no preview:

> Não foi possível encontrar o endereço IP do servidor de `35a5ef50-2295-4fa1-a671-c5c8bb57841e.lovableproject.com`

é um **erro de DNS do navegador**, não um erro gerado pelo seu app. Procurei em todo o código do projeto pela string `lovableproject` e **não há nenhuma referência** — ou seja, o app não está mandando ninguém para esse domínio.

O domínio `lovableproject.com` é uma URL **antiga/legada** da infraestrutura da Lovable. Os domínios atuais e válidos do seu projeto são:

- Preview: `https://id-preview--35a5ef50-2295-4fa1-a671-c5c8bb57841e.lovable.app`
- Publicado: `https://novarealeza.lovable.app`

Como não existe nada no código apontando para `lovableproject.com`, **não há correção possível dentro do projeto**. O erro vem de uma aba/janela aberta na URL antiga (provavelmente um link salvo nos favoritos, histórico do navegador, ou uma aba que ficou aberta de uma sessão anterior da Lovable).

## O que fazer

1. **Feche a aba** que está mostrando o erro de DNS.
2. Volte para o **editor da Lovable** e clique no botão de **Preview** novamente — ele vai abrir no domínio correto `.lovable.app`.
3. Se você tinha o link antigo salvo nos favoritos/atalhos, **substitua** por:
   - `https://id-preview--35a5ef50-2295-4fa1-a671-c5c8bb57841e.lovable.app` (preview, exige login na Lovable)
   - `https://novarealeza.lovable.app` (publicado, público)
4. Se quiser compartilhar o preview com alguém sem login, use **Share → Share preview** no editor (gera link público válido por 7 dias).

## Por que não dá pra "consertar no código"

O erro acontece **antes** do seu app carregar — o navegador tenta resolver o DNS de `lovableproject.com` e falha porque esse domínio não existe mais (ou não está respondendo) na infra da Lovable. Nenhuma alteração de HTML, JS, rota ou redirecionamento dentro do projeto vai mudar isso, porque o app nem chega a ser baixado pelo navegador nessa URL.

Se mesmo abrindo pelo botão de Preview do editor o erro continuar, é instabilidade da infra da Lovable — nesse caso use a URL publicada (`novarealeza.lovable.app`) enquanto isso.
