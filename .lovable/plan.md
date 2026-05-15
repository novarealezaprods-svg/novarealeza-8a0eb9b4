## O que está acontecendo
O problema não foi causado pela remoção da animação de rolagem. O site publicado principal está normal, mas o domínio `100beats.novarealezaprods.com.br` ainda está entregando uma versão antiga do HTML, que aponta para um arquivo CSS velho e quebrado.

- Endereço publicado funcionando: carrega `assets/index-C14aXekq.css`
- Domínio personalizado com problema: carrega `assets/index-CEC0WpJl.css`

Isso indica cache/proxy no domínio personalizado, não erro no código do site.

## Plano
1. Confirmar no painel de domínios que o domínio está configurado em modo compatível com Cloudflare/proxy.
2. Se estiver atrás de Cloudflare, reconectar o domínio marcando a opção **"Domain uses Cloudflare or a similar proxy"**.
3. Como alternativa rápida, desligar o proxy do subdomínio (`DNS only`) para ele buscar direto a versão nova do site.
4. Revalidar o domínio e testar novamente até ele passar a carregar o mesmo CSS da versão publicada.

## Passo a passo simples
### Opção recomendada
- Abra **Settings → Domains** no projeto
- Remova o domínio com problema
- Adicione novamente o domínio
- Na configuração avançada, ative **"Domain uses Cloudflare or a similar proxy"**
- Salve e aguarde a atualização

### Opção mais rápida no Cloudflare
- Abra o DNS do subdomínio `100beats`
- Troque a nuvem laranja para cinza (`DNS only`)
- Aguarde alguns minutos
- Atualize a página com recarga forçada

## Resultado esperado
Depois disso, o domínio personalizado deve parar de usar o CSS antigo e voltar a aparecer com o estilo normal.

## Detalhe técnico
O domínio principal já foi publicado corretamente. O problema é que o domínio personalizado ainda está servindo HTML antigo em cache/proxy, então ele pede um CSS antigo que não bate com a publicação atual.