# Painel Admin em `/admin`

## Situação atual

- A rota `/admin` **não existe** — por isso cai no 404.
- O site só tem 2 rotas: `/` (página de vendas) e `*` (NotFound).
- Todos os dados que a home consome já estão no backend:
  - `site_settings` (chaves: `preview_video`, `checkout_url`)
  - `proof_images` (prints de venda)
  - `beats` (lista de beats com nome, url, key, bpm, posição)
- Não existe sistema de login no projeto ainda.

## O que vou criar

### 1. Autenticação simples (email + senha)

- Habilitar auth por email/senha no backend (sem confirmação de email, pra você logar direto).
- Criar **1 usuário admin** com o email/senha que você me passar.
- Tabela `user_roles` + função `has_role()` (padrão seguro de roles, separado do perfil).
- Inserir você como `role = 'admin'`.

### 2. Página `/login`

- Formulário simples: email + senha.
- Após login, redireciona pra `/admin`.

### 3. Página `/admin` (protegida)

Só abre se você estiver logado **e** tiver role `admin`. Caso contrário, manda pra `/login`.

Painel com 4 seções (abas):

**a) Configurações gerais**
- Campo "Link do checkout" (Mercado Pago) → salva em `site_settings.checkout_url`
- Campo "Vídeo de preview" (URL) → salva em `site_settings.preview_video`

**b) Beats** (CRUD)
- Lista todos os beats com nome, BPM, key, posição
- Adicionar / editar / remover
- Reordenar (mudar posição)

**c) Provas sociais** (imagens)
- Lista as imagens com preview
- Adicionar URL nova / remover / reordenar

**d) Logout**
- Botão pra sair.

### 4. Pequeno ajuste de segurança

Hoje as tabelas (`beats`, `proof_images`, `site_settings`) têm RLS aberto pra **qualquer um** escrever (`public write`). Isso é um risco — qualquer pessoa na internet pode apagar/alterar seus beats via API.

Vou trocar as policies de escrita pra exigir role `admin`. Leitura continua pública (a home precisa ler).

## O que preciso de você

Quando aprovar, me responde com:
1. **Email** que você quer usar pra logar
2. **Senha** inicial (pode trocar depois)

## Detalhes técnicos

- Stack: TanStack Router (rotas em `src/routes/`), Supabase Auth, RLS policies
- Novas rotas: `src/routes/login.tsx`, `src/routes/admin.tsx` (com guard via `beforeLoad`)
- Migration SQL:
  - `create type app_role as enum ('admin')`
  - `create table user_roles (user_id, role, unique(user_id, role))` + RLS
  - `create function has_role(_user_id, _role) security definer`
  - `drop policy "public write ..."` nas 3 tabelas, recriar com `using (has_role(auth.uid(), 'admin'))`
- Migrar `src/main.tsx` (BrowserRouter atual) — adicionar as rotas novas mantendo `/` funcionando
- Auth state: listener `onAuthStateChange` + `getSession` no guard
