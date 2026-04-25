import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, VolumeX } from "lucide-react";

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

function normalizeDirectUrl(url: string): string {
  if (!url) return url;
  if (/dropbox\.com/.test(url)) {
    let u = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
    u = u.replace(/([?&])dl=0(&|$)/, "$1raw=1$2");
    if (!/[?&](raw|dl)=1/.test(u)) {
      u += (u.includes("?") ? "&" : "?") + "raw=1";
    }
    return u;
  }
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return `https://drive.google.com/uc?export=download&id=${gd[1]}`;
  return url;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const [unmuted, setUnmuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!embed || embed.provider !== "youtube") return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange" && data?.info === 0) setEnded(true);
      } catch {}
    };
    window.addEventListener("message", handler);
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
    <div className="relative w-full h-full bg-black">
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
          src={directUrl}
          autoPlay
          muted
          playsInline
          onEnded={() => setEnded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Unmute overlay — minimalista estilo dcadencebeats */}
      {!unmuted && !ended && (
        <button
          onClick={unmute}
          aria-label="Ativar som"
          className="absolute inset-0 z-20 flex items-center justify-center group"
        >
          <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <VolumeX className="h-9 w-9 text-primary-foreground" />
          </div>
        </button>
      )}

      {/* Replay overlay */}
      {ended && (
        <button
          onClick={replay}
          aria-label="Assistir novamente"
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 group"
        >
          <div className="h-20 w-20 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <RotateCcw className="h-9 w-9 text-primary-foreground" />
          </div>
        </button>
      )}
    </div>
  );
}
