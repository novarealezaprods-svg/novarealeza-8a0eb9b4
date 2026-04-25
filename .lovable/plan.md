## Plano para restaurar o acesso ao /admin

### O problema identificado
O `/admin` não sumiu por ter sido removido da aplicação. A rota ainda existe em `src/main.tsx` e a página ainda existe em `src/pages/Admin.tsx`.

O bloqueio real é outro: o projeto está com erro de build por causa destes dois arquivos:
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/client.server.ts`

Hoje eles importam módulos que não existem nesse projeto (`@tanstack/react-start`), então a aplicação falha ao compilar. Quando o build quebra, o site publicado pode parar de refletir corretamente as rotas, incluindo `/admin`.

### O que vou fazer
1. Remover ou neutralizar os dois arquivos quebrados que sobraram no projeto e não estão sendo usados por nenhuma outra parte do código.
2. Garantir que o build volte a passar sem mexer no conteúdo do seu admin.
3. Confirmar que a rota `/admin` continua apontando para `src/pages/Admin.tsx`.
4. Validar no preview que o painel abre novamente.
5. Se necessário, orientar o republish para a versão publicada voltar a refletir o estado correto.

### Resultado esperado
- `/admin` volta a abrir
- seu painel continua com os campos de vídeo, checkout, beats e imagens
- nenhum link salvo no banco é apagado

### Detalhes técnicos
- `src/main.tsx` já declara: `path="/admin" element={<AdminPage />}`
- `src/pages/Admin.tsx` continua carregando os dados das tabelas `site_settings`, `proof_images` e `beats`
- a falha atual vem de imports inválidos em arquivos órfãos, não de perda de dados nem remoção da rota

### Observação
Não vou alterar seus dados salvos. O foco é só restaurar a compilação e o acesso ao painel.