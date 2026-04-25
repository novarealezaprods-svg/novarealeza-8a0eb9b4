## Problema

As imagens de prova social não aparecem (só ícone azul de imagem quebrada) porque as URLs no banco usam `https://www.dropbox.com/...?raw=1`. Esse host **não serve a imagem como binário** — devolve uma página HTML de visualização, então `<img>` não consegue exibir.

A correção é simples: usar `https://dl.dropboxusercontent.com/...` (o host de download direto). O projeto **já tem** uma função utilitária para isso em `src/components/VideoPreview.tsx` (`normalizeDirectUrl`), atualmente só usada para vídeo.

## Solução

1. **Extrair `normalizeDirectUrl`** para um arquivo utilitário compartilhado: `src/lib/normalize-url.ts`.
2. **Atualizar `src/components/VideoPreview.tsx`** para importar a função do novo local (mantendo o mesmo comportamento).
3. **Atualizar `src/pages/Index.tsx`**: aplicar `normalizeDirectUrl(src)` no `<img src=...>` da grade de provas sociais (linha ~149). Isso conserta as 6 imagens já cadastradas instantaneamente, sem precisar editar nada no banco.
4. **Atualizar `src/pages/Admin.tsx`**: ao adicionar uma nova imagem, normalizar a URL antes de salvar no banco, para que futuras imagens já entrem no formato correto.

## Resultado

- As 6 imagens atuais passam a carregar imediatamente na home, sem mexer no banco.
- Novas imagens adicionadas pelo /admin via link do Dropbox funcionarão automaticamente, independente do formato que o usuário colar (`?dl=0`, `?raw=1`, `www.dropbox.com`, etc.).
- Links do Google Drive também passam a funcionar (a função já trata esse caso).