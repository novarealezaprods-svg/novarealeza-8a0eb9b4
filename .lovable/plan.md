## Objetivo
Restaurar a área `/admin` que sumiu no site publicado e garantir que ela volte a abrir normalmente.

## O que vou fazer
1. Remover ou corrigir os arquivos de integração de backend adicionados por último que estão quebrando o build:
   - `src/integrations/supabase/auth-middleware.ts`
   - `src/integrations/supabase/client.server.ts`
2. Validar que o app volta a compilar sem erros.
3. Confirmar que a rota `/admin` continua registrada em `src/main.tsx` e aponta para `src/pages/Admin.tsx`.
4. Verificar novamente o comportamento de `/admin` no preview e no publicado.
5. Se necessário, adicionar um acesso discreto para o admin na home para evitar que “desapareça” visualmente novamente.

## Diagnóstico confirmado
- A rota `/admin` existe no código atual.
- A página `src/pages/Admin.tsx` existe.
- O problema principal não é a rota em si: o site publicado está falhando por erro de build.
- O erro atual vem destes imports inexistentes:
  - `@tanstack/react-start`
  - `@tanstack/react-start/server`
- Esses imports estão em `src/integrations/supabase/auth-middleware.ts` e impedem a publicação correta. Com o build quebrado, o domínio publicado responde apenas com `Not Found`.

## Resultado esperado
- `/admin` volta a carregar.
- O build deixa de falhar.
- O site publicado deixa de mostrar `Not Found` nessa rota.

## Detalhes técnicos
- O projeto atual está estruturado com `react-router-dom` em `src/main.tsx`, não com `@tanstack/react-start`.
- Como esse pacote nem está listado no `package.json`, qualquer import dele causa erro de compilação.
- Como os arquivos problemáticos não fazem parte da rota `/admin` em si, a correção mais segura é remover a dependência inválida deles ou eliminar esses arquivos se estiverem sem uso.
- Depois da correção, preciso validar a publicação porque hoje o preview e o publicado estão com comportamentos diferentes.

Aprovando, eu aplico a correção agora.