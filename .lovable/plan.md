## Problema

O `/admin` está quebrado porque dois arquivos no projeto importam `@tanstack/react-start`, um pacote que **não está instalado** (este projeto usa Vite + React Router DOM, não TanStack Start).

Esses arquivos são:
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/client.server.ts`

Ambos são **órfãos** — nenhum outro arquivo do projeto os importa. Mas mesmo assim eles quebram o build do Vite por causa do import inexistente, fazendo o `/admin` (e às vezes o `/`) parar de funcionar.

A página `src/pages/Admin.tsx` em si está **intacta e correta** — usa só o cliente Supabase normal e o React Router DOM.

## Solução

1. **Deletar** `src/integrations/supabase/auth-middleware.ts`
2. **Deletar** `src/integrations/supabase/client.server.ts`

Não há mais nada a mudar. Após a remoção:
- O build do Vite volta a passar
- A rota `/admin` volta a abrir o painel normalmente
- Login/leitura/escrita das tabelas (`beats`, `proof_images`, `site_settings`) continua funcionando como já estava (RLS público)

## Observação

Esses arquivos têm sido recriados automaticamente em algumas edições anteriores porque parecem ser o template padrão do Lovable Cloud para projetos TanStack Start. Como este projeto **não é** TanStack Start, eles devem permanecer apagados. Se reaparecerem, basta apagar de novo — eles não são usados em lugar nenhum.