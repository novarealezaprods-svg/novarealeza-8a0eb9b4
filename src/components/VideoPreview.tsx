import { useEffect, useRef, useState } from "react";
import { RotateCcw, Volume2, Loader2 } from "lucide-react";

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

export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const [ended, setEnded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytDuration = useRef(0);
  const pollRef = useRef<number | null>(null);

  // YouTube postMessage state + progress polling
  useEffect(() => {
    if (!embed || embed.provider !== "youtube") return;
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange") {
          if (data?.info === 0) setEnded(true);
          if (data?.info === 1) setLoading(false); // playing
          if (data?.info === 3) setLoading(true); // buffering
        }
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
    }, 500);
    pollRef.current = window.setInterval(() => {
      post({ event: "command", func: "getCurrentTime", args: [] });
      post({ event: "command", func: "getDuration", args: [] });
    }, 250);
    // safety: if no signal in 2.5s, hide loader
    const safety = window.setTimeout(() => setLoading(false), 2500);
    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(init);
      clearTimeout(safety);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [embed, reloadKey]);

  // Show the "raise the volume" notice for ~3s when playback starts.
  useEffect(() => {
    if (loading || ended) return;
    setShowNotice(true);
    const t = window.setTimeout(() => setShowNotice(false), 3000);
    return () => window.clearTimeout(t);
  }, [loading, ended, reloadKey]);

  useEffect(() => {
    if (loading || ended) return;

    if (embed?.provider === "youtube") {
      const post = (msg: object) =>
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
      post({ event: "command", func: "unMute", args: [] });
      post({ event: "command", func: "setVolume", args: [100] });
      return;
    }

    if (embed?.provider === "vimeo") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "setVolume", value: 1 }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "setMuted", value: false }),
        "*"
      );
      return;
    }

    if (videoRef.current) {
      try {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
      } catch {}
    }
  }, [loading, ended, reloadKey, embed]);

  useEffect(() => {
    if (embed || !videoRef.current) return;
    const video = videoRef.current;
    setPlaybackFailed(false);

    const tryPlay = async () => {
      try {
        video.muted = true;
        video.defaultMuted = true;
        video.volume = 0;
        await video.play();
      } catch {
        setPlaybackFailed(true);
        setLoading(false);
      }
    };

    void tryPlay();
  }, [embed, directUrl, reloadKey]);

  const replay = () => {
    setEnded(false);
    setProgress(0);
    setLoading(true);
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
          preload="auto"
          playsInline
          onEnded={() => setEnded(true)}
          onPlaying={() => setLoading(false)}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onError={() => {
            setPlaybackFailed(true);
            setLoading(false);
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) setProgress((v.currentTime / v.duration) * 100);
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Loading spinner — Netflix-style rápido */}
      {loading && !ended && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black pointer-events-none">
          <Loader2
            className="h-10 w-10 text-primary animate-spin"
            style={{ animationDuration: "0.6s" }}
          />
        </div>
      )}

      {/* Volume notice — auto-dismiss after ~3s, não clicável */}
      {showNotice && !ended && !loading && (
        <div
          aria-live="polite"
          className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 animate-fade-in pointer-events-none"
        >
          <div
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-[var(--shadow-glow)] hover:scale-105 transition-transform"
            style={{
              boxShadow:
                "0 0 20px var(--primary), 0 0 6px var(--primary), 0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-foreground" />
            </span>
            <Volume2 className="h-4 w-4" />
            <span>O vídeo já começou — aumente o volume</span>
          </div>
        </div>
      )}

      {playbackFailed && !ended && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4 pointer-events-none">
          <div
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-[var(--shadow-glow)]"
            style={{
              boxShadow:
                "0 0 20px var(--primary), 0 0 6px var(--primary), 0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <Volume2 className="h-4 w-4" />
            <span>O vídeo não carregou direito — recarregue a página</span>
          </div>
        </div>
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
      {!ended && !loading && (
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
