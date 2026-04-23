import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";

function getEmbedUrl(url: string): { src: string; provider: "youtube" | "vimeo" } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`, provider: "youtube" };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&playsinline=1`, provider: "vimeo" };
  return null;
}

export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const [unmuted, setUnmuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for YouTube end event
  useEffect(() => {
    if (!embed || embed.provider !== "youtube") return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange" && data?.info === 0) setEnded(true);
      } catch {}
    };
    window.addEventListener("message", handler);
    // Tell YT iframe to send us events
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1 }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }),
        "*"
      );
    }, 800);
    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(t);
    };
  }, [embed, reloadKey]);

  const unmute = () => {
    setUnmuted(true);
    if (embed?.provider === "youtube") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "unMute", args: [] }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
        "*"
      );
    } else if (embed?.provider === "vimeo") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "setVolume", value: 1 }),
        "*"
      );
    } else if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
    }
  };

  const replay = () => {
    setEnded(false);
    setUnmuted(false);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="relative w-full h-full">
      {embed ? (
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={embed.src}
          title="Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <video
          key={reloadKey}
          ref={videoRef}
          src={url}
          autoPlay
          muted
          playsInline
          onEnded={() => setEnded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Unmute overlay */}
      {!unmuted && !ended && (
        <button
          onClick={unmute}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-[2px] hover:bg-background/30 transition-colors group"
        >
          <div className="h-16 w-16 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
          </div>
          <div className="bg-background/90 px-4 py-2 rounded-full border border-border/60">
            <p className="text-sm font-bold text-foreground">O vídeo já começou — clique para ouvir</p>
          </div>
        </button>
      )}

      {/* Replay overlay */}
      {ended && (
        <button
          onClick={replay}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm group"
        >
          <div className="h-16 w-16 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <RotateCcw className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground bg-background/90 px-4 py-2 rounded-full border border-border/60">
            Assistir novamente
          </p>
        </button>
      )}
    </div>
  );
}