## Diagnóstico

A rota `/admin` está configurada corretamente em `src/main.tsx` (BrowserRouter + React Router DOM). O problema é de **hospedagem**, não de código:

- `GET /` → 200 OK
- `GET /admin` → **404** (no preview e no site publicado `novarealeza.lovable.app`)

Esta é uma SPA Vite pura (não TanStack Start, apesar do nome no `package.json`). Quando o usuário acessa `/admin` diretamente, o servidor procura um arquivo físico nesse caminho, não encontra e devolve 404 antes que o React Router possa atuar. O `vercel.json` existe, mas o Lovable hosting não o usa — precisa de um arquivo `_redirects` em `public/`.

## Correção

1. **Criar `public/_redirects`** com o fallback de SPA:
   ```
   /*    /index.html   200
   ```
   Isso faz o servidor entregar `index.html` para qualquer rota desconhecida, e o React Router assume o roteamento no cliente. `/admin` então renderiza o `AdminPage`, que mostra a tela de senha quando `sessionStorage` não está marcado.

2. **Validar** após o deploy:
   - Acessar `/admin` direto → tela "Painel Admin / Senha" aparece
   - O fluxo de autenticação local (senha `admin123` em `sessionStorage`) já funciona — sem alterações em `Admin.tsx`

Nenhuma outra mudança no código é necessária.
