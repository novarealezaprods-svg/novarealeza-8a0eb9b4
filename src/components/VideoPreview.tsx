import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { registerVslPause, pauseCurrent } from "@/components/BeatPlayer";

function getEmbedUrl(url: string): { src: string; provider: "youtube" | "vimeo" } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt)
    return {
      src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`,
      provider: "youtube",
    };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm)
    return {
      src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&playsinline=1`,
      provider: "vimeo",
    };
  return null;
}


export function VideoPreview({ url, poster }: { url: string; poster?: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Player dourado: o video sempre existe num unico <video> no DOM -- nunca
  // duplicado -- e so muda de posicao/tamanho via CSS quando "expande".
  // Isso e o que evita o bug de dois audios tocando ao mesmo tempo: nao ha
  // um segundo elemento pra perder o controle. So se aplica ao video direto
  // (mp4 proprio); o embed do YouTube/Vimeo continua como estava.
  const [expanded, setExpanded] = useState(false);

  // Ao clicar em qualquer beat, o player global (BeatPlayer) chama isso pra
  // pausar a VSL na hora, evitando os dois áudios tocando juntos.
  useEffect(() => {
    const pauseVsl = () => {
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
      const f = iframeRef.current;
      if (f?.contentWindow && embed) {
        const cmd =
          embed.provider === "youtube"
            ? { event: "command", func: "pauseVideo", args: "" }
            : { method: "pause" };
        f.contentWindow.postMessage(JSON.stringify(cmd), "*");
      }
      // Se a pessoa clicou num beat com o player dourado ainda expandido e
      // com som, fecha e remuda aqui tambem -- senao a VSL continuaria
      // audivel por cima da previa que acabou de comecar.
      if (v) v.muted = true;
      setExpanded(false);
    };
    registerVslPause(pauseVsl);

    // No navegador interno do Instagram/TikTok, tocar num link (ex.: "sair
    // do anúncio") não descarrega a página -- ela só vai pro fundo, sem
    // disparar beforeunload/unload. Sem isso, a VSL e o beat que estivesse
    // tocando continuavam com áudio até a aba ser fechada na força.
    const pauseEverything = () => {
      pauseVsl();
      pauseCurrent();
    };
    const onVisibility = () => {
      if (document.hidden) pauseEverything();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pauseEverything);

    return () => {
      registerVslPause(null);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pauseEverything);
    };
  }, [embed]);

  // Fecha o player dourado com Esc, so enquanto ele estiver expandido.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // O video ja esta tocando (autoplay mudo) desde que a pagina carregou --
  // "ativar o som" e' so' tirar o mute do MESMO elemento, por isso sai
  // instantaneo: sem buffer, sem recarregar, sem esperar nada.
  const ativar = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      // Recomeca do zero: a visita pode ter clicado com o video ja no meio
      // do loop mudo, e o pedido e' ela ver e ouvir o conteudo inteiro.
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    setExpanded(true);
  };

  // Fechar SEMPRE remuda antes de encolher, mesmo que pareca redundante --
  // e' a garantia contra o audio continuar saindo depois que a pessoa ja
  // saiu do player e vai ouvir as previas dos beats logo abaixo.
  const fechar = () => {
    const v = videoRef.current;
    if (v) v.muted = true;
    setExpanded(false);
  };

  if (embed) {
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          ref={iframeRef}
          src={
            embed.provider === "youtube"
              ? `https://www.youtube.com/embed/${embed.src.match(/embed\/([\w-]{11})/)?.[1]}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1`
              : embed.src.replace(/[?&]autoplay=1/, "").replace(/[?&]muted=1/, "")
          }
          title="Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full h-full bg-black">
        {/* O video nunca troca de lugar no DOM -- so' de classe, via CSS --
            entao o play, o currentTime e o estado de mute sobrevivem intactos
            ao abrir e fechar o player dourado. */}
        <video
          ref={videoRef}
          src={directUrl}
          poster={poster}
          preload="auto"
          autoPlay
          muted
          loop
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          controls={false}
          onClick={!expanded ? ativar : undefined}
          className={expanded ? "vsl-video-expanded" : "absolute inset-0 w-full h-full object-cover cursor-pointer"}
        >
          {/* TODO: trocar por legenda real (transcricao da fala) quando
              tivermos o texto -- por ora so' evita o video sem <track>. */}
          <track kind="captions" srcLang="pt-BR" label="Português" src="/captions/empty.vtt" default />
        </video>

        {!expanded && (
          <button
            type="button"
            onClick={ativar}
            aria-label="Ativar o som e assistir"
            className="vsl-gold-btn"
          >
            <span className="vsl-gold-btn-ring" aria-hidden="true" />
            <Play className="h-7 w-7 md:h-8 md:w-8 relative" fill="currentColor" />
          </button>
        )}
      </div>

      {expanded && (
        <>
          <div className="vsl-backdrop" onClick={fechar} aria-hidden="true" />
          <button type="button" onClick={fechar} aria-label="Fechar vídeo" className="vsl-close-btn">
            <X className="h-6 w-6" />
          </button>
        </>
      )}
    </>
  );
}
