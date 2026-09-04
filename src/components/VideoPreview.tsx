import { useEffect, useRef } from "react";
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

  // Sem player: a VSL toca sozinha assim que a página carrega. Autoplay com
  // som exige gesto do usuário em todo navegador, então ela nasce mutada --
  // um toque no vídeo ativa o áudio, sem nenhum botão por cima.
  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (v.paused) v.play().catch(() => {});
  };

  return (
    <div className="relative w-full h-full bg-black">
      {embed ? (
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
      ) : (
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
          onClick={unmute}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        >
          {/* TODO: trocar por legenda real (transcricao da fala) quando
              tivermos o texto -- por ora so' evita o video sem <track>. */}
          <track kind="captions" srcLang="pt-BR" label="Português" src="/captions/empty.vtt" default />
        </video>
      )}
    </div>
  );
}
