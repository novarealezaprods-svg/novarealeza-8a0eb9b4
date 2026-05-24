## Objetivo
Corrigir o bug em que a VSL pausa no mobile ao tocar em **ativar áudio**, sem alterar o visual nem quebrar play/pause, replay e barra de progresso.

## Plano
1. Ajustar o fluxo do botão **ativar áudio** para garantir que toda a sequência de unmute + restart + play aconteça dentro do mesmo gesto do usuário.
2. Blindar o clique do botão para que ele não dispare nenhum outro handler do vídeo ao mesmo tempo.
3. Revisar a lógica de play/pause do vídeo direto para evitar conflito entre o toque de ativar áudio e o toggle invisível/de toque no vídeo.
4. Validar o comportamento no mobile: tocar em ativar áudio deve reiniciar do começo e seguir reproduzindo com som, sem entrar em pause.

## Detalhes técnicos
- Manter a correção concentrada em `src/components/VideoPreview.tsx`.
- Garantir `stopPropagation()` e `preventDefault()` no clique do botão de áudio.
- Fazer `muted = false`, `currentTime = 0` e `play()` em sequência síncrona de gesto sempre que for vídeo direto.
- Só atualizar o estado visual de `muted` após confirmação de reprodução, para evitar esconder o overlay cedo demais.
- Se necessário, limitar temporariamente o toggle de play/pause logo após o unmute para impedir duplo disparo no mobile.
- Não mexer em layout, estilo, textos, performance geral ou outras partes da página.