import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2 } from "lucide-react";

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
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

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
    setCurrent(0);
    setReloadKey((k) => k + 1);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.volume = 1;
      setUnmuted(true);
    } else {
      v.muted = true;
      setUnmuted(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    v.currentTime = Math.max(0, Math.min(duration, x * duration));
    setCurrent(v.currentTime);
  };

  const startScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const bar = e.currentTarget;
    bar.setPointerCapture(e.pointerId);
    const update = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      v.currentTime = x * duration;
      setCurrent(v.currentTime);
    };
    update(e.clientX);
    const move = (ev: PointerEvent) => update(ev.clientX);
    const end = () => {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", end);
      bar.removeEventListener("pointercancel", end);
    };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
  };

  const enterFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const onMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 2500);
  };

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
      className="relative w-full h-full bg-black"
    >
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
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setEnded(true);
          }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        />
      )}

      {/* Custom controls — only for direct video files */}
      {!embed && !ended && (
        <div
          className={`absolute inset-x-0 bottom-0 z-10 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* gradient backdrop */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

          <div className="relative px-4 sm:px-5 pb-4 pt-10">
            {/* Progress bar */}
            <div
              onClick={seek}
              className="group/bar relative h-2 cursor-pointer rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-150"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 12px var(--primary), 0 0 4px var(--primary)",
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-primary opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{
                  left: `${progress}%`,
                  boxShadow: "0 0 10px var(--primary)",
                }}
              />
            </div>

            {/* Controls row */}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={togglePlay}
                aria-label={playing ? "Pausar" : "Tocar"}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 hover:scale-105 active:scale-100 transition"
              >
                {playing ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                aria-label={unmuted ? "Mutar" : "Ativar som"}
                className="h-9 w-9 rounded-full text-white/90 hover:text-primary hover:bg-white/10 flex items-center justify-center transition"
              >
                {unmuted ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <div className="text-xs font-mono tabular-nums text-white/90 tracking-wide">
                <span className="text-primary">{formatTime(current)}</span>
                <span className="text-white/50 mx-1.5">/</span>
                <span className="text-white/70">{formatTime(duration)}</span>
              </div>

              <div className="flex-1" />

              <button
                onClick={enterFullscreen}
                aria-label="Tela cheia"
                className="h-9 w-9 rounded-full text-white/90 hover:text-primary hover:bg-white/10 flex items-center justify-center transition"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unmute overlay */}
      {!unmuted && !ended && (
        <button
          onClick={unmute}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-[2px] hover:bg-background/30 transition-colors group"
        >
          <div className="h-16 w-16 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-primary-foreground fill-current ml-1" />
          </div>
          <div className="bg-background/90 px-4 py-2 rounded-full border border-primary/40">
            <p className="text-sm font-bold text-foreground">O vídeo já começou — clique para ouvir</p>
          </div>
        </button>
      )}

      {/* Replay overlay */}
      {ended && (
        <button
          onClick={replay}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm group"
        >
          <div className="h-16 w-16 rounded-full bg-primary/95 flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform">
            <RotateCcw className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground bg-background/90 px-4 py-2 rounded-full border border-primary/40">
            Assistir novamente
          </p>
        </button>
      )}
    </div>
  );
}
