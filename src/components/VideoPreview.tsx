import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Loader2 } from "lucide-react";

function getEmbedUrl(url: string): { src: string; provider: "youtube" | "vimeo" } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt)
    return {
      src: `https://www.youtube.com/embed/${yt[1]}?autoplay=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`,
      provider: "youtube",
    };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm)
    return {
      src: `https://player.vimeo.com/video/${vm[1]}?autoplay=0&playsinline=1`,
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

export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytDuration = useRef(0);
  const pollRef = useRef<number | null>(null);

  // YouTube postMessage state + progress polling
  useEffect(() => {
    if (!embed || embed.provider !== "youtube" || !started) return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange" && data?.info === 0) setEnded(true);
        if (data?.event === "infoDelivery" && data?.info) {
          if (typeof data.info.duration === "number" && data.info.duration > 0) {
            ytDuration.current = data.info.duration;
          }
          if (typeof data.info.currentTime === "number" && ytDuration.current > 0) {
            setProgress((data.info.currentTime / ytDuration.current) * 100);
          }
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    const post = (msg: object) =>
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
    const init = setTimeout(() => {
      post({ event: "listening", id: 1 });
      post({ event: "command", func: "addEventListener", args: ["onStateChange"] });
      post({ event: "command", func: "playVideo", args: [] });
    }, 500);
    pollRef.current = window.setInterval(() => {
      post({ event: "command", func: "getCurrentTime", args: [] });
      post({ event: "command", func: "getDuration", args: [] });
    }, 250);
    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(init);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [embed, started, reloadKey]);

  const start = () => {
    setStarted(true);
    setLoading(true);
    if (embed?.provider === "vimeo") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "play" }),
        "*"
      );
    } else if (!embed && videoRef.current) {
      const v = videoRef.current;
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {});
    }
    if (embed) {
      window.setTimeout(() => setLoading(false), 1200);
    }
  };

  const replay = () => {
    setEnded(false);
    setStarted(false);
    setProgress(0);
    setLoading(false);
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
          playsInline
          onEnded={() => setEnded(true)}
          onPlaying={() => setLoading(false)}
          onWaiting={() => setLoading(true)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (loading) setLoading(false);
            if (v.duration > 0) setProgress((v.currentTime / v.duration) * 100);
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Loading spinner */}
      {started && loading && !ended && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 pointer-events-none animate-fade-in">
          <Loader2 className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "0.6s" }} />
        </div>
      )}

      {/* Play overlay */}
      {!started && !ended && (
        <button
          onClick={start}
          aria-label="Tocar vídeo"
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 group"
        >
          <div className="h-20 w-20 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <Play className="h-9 w-9 text-primary-foreground fill-current ml-1" />
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

      {/* Progress bar — verde fluorescente */}
      {started && !ended && (
        <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/15 pointer-events-none">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-linear"
            style={{
              width: `${progress}%`,
              boxShadow: "0 0 10px var(--primary), 0 0 4px var(--primary)",
            }}
          />
        </div>
      )}
    </div>
  );
}
