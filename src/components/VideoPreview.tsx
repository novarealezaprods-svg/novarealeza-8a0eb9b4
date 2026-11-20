import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const videoRef = useRef<HTMLVideoElement>(null); // video pequeno, ambiente, sempre mudo
  const expandedVideoRef = useRef<HTMLVideoElement>(null); // video do player dourado, com som
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Player dourado: usa um SEGUNDO <video>, so' montado em document.body (via
  // portal) enquanto "expanded" e' true. Por que dois elementos e nao um so
  // reposicionado por CSS: a secao do hero tem overflow-hidden, e no Safari
  // do iPhone isso faz position:fixed de um descendente se comportar como
  // se estivesse preso aquela caixa, em vez da tela real -- foi exatamente
  // o bug visto no celular (fundo opaco nunca aparecia, video nao expandia
  // de verdade). O portal escapa dessa caixa de vez.
  // Isso NAO reintroduz o risco de dois audios: o video pequeno e' SEMPRE
  // mudo (nunca alternado), entao so' um dos dois pode emitir som a
  // qualquer momento -- o expandido, que so existe no DOM enquanto o
  // player esta aberto.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const pauseVsl = () => {
      const v = videoRef.current;
      if (v && !v.paused) v.pause();
      const ev = expandedVideoRef.current;
      if (ev) ev.pause();
      const f = iframeRef.current;
      if (f?.contentWindow && embed) {
        const cmd =
          embed.provider === "youtube"
            ? { event: "command", func: "pauseVideo", args: "" }
            : { method: "pause" };
        f.contentWindow.postMessage(JSON.stringify(cmd), "*");
      }
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

  // So abre: o video expandido e' um elemento novo a cada vez que monta,
  // entao ja nasce do zero (currentTime 0) e com som -- nao precisa
  // sincronizar nada com o video pequeno mudo.
  const ativar = () => setExpanded(true);

  // Fechar pausa explicitamente antes de desmontar -- garantia extra contra
  // audio sobrando por uma fracao de segundo, mesmo que o unmount do React
  // normalmente ja resolva isso sozinho. Importa porque logo abaixo no
  // proximo bloco tem as previas dos beats: se sobrar som daqui, atrapalha
  // quem ja saiu do video.
  const fechar = () => {
    expandedVideoRef.current?.pause();
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
          onClick={ativar}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        >
          {/* TODO: trocar por legenda real (transcricao da fala) quando
              tivermos o texto -- por ora so' evita o video sem <track>. */}
          <track kind="captions" srcLang="pt-BR" label="Português" src="/captions/empty.vtt" default />
        </video>

        <button
          type="button"
          onClick={ativar}
          aria-label="Ativar o som e assistir"
          className="vsl-gold-btn"
        >
          <span className="vsl-gold-btn-ring" aria-hidden="true" />
          <Play className="h-7 w-7 md:h-8 md:w-8 relative" fill="currentColor" />
        </button>
      </div>

      {expanded &&
        createPortal(
          <>
            {/* Fundo do proprio site, so que escurecido -- nao e' uma
                parede solida: a pagina continua visivel por baixo, em
                opacidade baixa. */}
            <div className="vsl-backdrop" onClick={fechar} aria-hidden="true" />
            <video
              ref={expandedVideoRef}
              src={directUrl}
              autoPlay
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              controls={false}
              className="vsl-video-expanded"
            >
              <track kind="captions" srcLang="pt-BR" label="Português" src="/captions/empty.vtt" default />
            </video>
            <button type="button" onClick={fechar} aria-label="Fechar vídeo" className="vsl-close-btn">
              <X className="h-6 w-6" />
            </button>
          </>,
          document.body
        )}
    </>
  );
}
