Vou corrigir o problema em duas frentes, porque o bug não está só no player:

1. Refatorar o player para usar apenas um `Audio()` global compartilhado
- Centralizar reprodução, pausa, progresso e estado ativo em um único controlador global.
- Garantir a regra principal: ao tocar um beat, qualquer outro para imediatamente e volta para o início.
- Manter exatamente o mesmo visual dos cards e botões.
- Adicionar tratamento de erro por beat para evitar estado travado quando uma URL falhar.

2. Corrigir a origem das URLs dos beats
- Remover a dependência do formato atual de links do Dropbox que hoje está retornando HTML/404 para vários beats.
- Ajustar a normalização de URL para não gerar links inválidos.
- Se necessário, trocar os beats problemáticos para URLs públicas estáveis do backend/storage do projeto, que são adequadas para reprodução direta.

3. Validar os 10 beats cadastrados
- Conferir os 10 registros atuais da tabela de beats.
- Identificar quais URLs estão válidas e quais estão quebradas.
- Atualizar os registros problemáticos para garantir que todos os 10 tenham um arquivo de áudio realmente reproduzível.

4. Testar o comportamento final
- Verificar que qualquer um dos 10 beats consegue iniciar.
- Verificar que clicar em outro beat pausa o anterior e zera o tempo.
- Verificar que nenhum beat fica permanentemente mudo após outro tocar.

Detalhes técnicos
- Hoje os beats em `position` 0, 1, 6 e 9 usam URLs públicas do storage e tendem a responder com `audio/wav`.
- Vários outros beats usam links do Dropbox que, no formato atual, não retornam o arquivo de áudio diretamente para o browser.
- Então a solução correta é combinar:
  - controlador global único de áudio
  - URLs de mídia realmente reproduzíveis

Assim que você aprovar, eu implemento a refatoração e corrijo os links problemáticos para deixar os 10 funcionando de verdade.