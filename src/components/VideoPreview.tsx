import { useEffect, useRef, useState } from "react";
import { RotateCcw, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";

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

export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const [ended, setEnded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadFading, setLoadFading] = useState(false);
  const [loadHidden, setLoadHidden] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytDuration = useRef(0);
  const pollRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

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

  // Autoplay ativo (muted). Clique do usuário desativa o mute.
  const startPlayback = () => {
    setStarted(true);
    setMuted(false);
    setPaused(false);
    if (embed?.provider === "youtube") {
      const post = (msg: object) =>
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
      post({ event: "command", func: "unMute", args: [] });
      post({ event: "command", func: "setVolume", args: [100] });
      post({ event: "command", func: "playVideo", args: [] });
      return;
    }
    if (embed?.provider === "vimeo") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "setMuted", value: false }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "setVolume", value: 1 }),
        "*"
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "play" }),
        "*"
      );
      return;
    }
    if (videoRef.current) {
      try {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        void videoRef.current.play();
      } catch {}
      setPlaybackFailed(false);
    }
  };

  useEffect(() => {
    if (embed || !videoRef.current) return;
    // Autoplay muted no carregamento
    const v = videoRef.current;
    v.muted = true;
    setPlaybackFailed(false);
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setPlaybackFailed(true));
    }
  }, [embed, directUrl, reloadKey]);

  const replay = () => {
    setEnded(false);
    setProgress(0);
    setLoading(true);
    setPaused(false);
    setStarted(true);
    setMuted(true);
    setLoadProgress(0);
    setLoadFading(false);
    setLoadHidden(false);
    setReloadKey((k) => k + 1);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const seekFromEvent = (clientX: number) => {
    const v = videoRef.current;
    const bar = progressBarRef.current;
    if (!v || !bar || !v.duration || !isFinite(v.duration)) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
    setProgress(ratio * 100);
  };

  // Loading overlay progress simulation (caps at 90% if no real progress)
  useEffect(() => {
    if (loadHidden) return;
    setLoadProgress(0);
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const simulated = Math.min(90, (elapsed / 3000) * 90);
      setLoadProgress((p) => (p < simulated ? simulated : p));
      if (elapsed >= 3000) window.clearInterval(id);
    }, 60);
    return () => window.clearInterval(id);
  }, [reloadKey, loadHidden]);

  // When video becomes ready, complete the bar and fade out
  useEffect(() => {
    if (loading || ended || loadHidden) return;
    setLoadProgress(100);
    const t1 = window.setTimeout(() => setLoadFading(true), 80);
    const t2 = window.setTimeout(() => setLoadHidden(true), 80 + 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [loading, ended, loadHidden]);

  // Real buffered progress for direct <video>
  const handleVideoProgress = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !isFinite(v.duration)) return;
    if (v.buffered.length === 0) return;
    const buffered = v.buffered.end(v.buffered.length - 1);
    const pct = Math.min(99, (buffered / v.duration) * 100);
    setLoadProgress((p) => (p < pct ? pct : p));
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
          muted={muted}
          preload="auto"
          playsInline
          onEnded={() => setEnded(true)}
          onPlaying={() => { setLoading(false); setPaused(false); }}
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onProgress={handleVideoProgress}
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

      {/* Loading overlay — VSL (somente após iniciar) */}
      {started && !loadHidden && !ended && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none rounded-[inherit] overflow-hidden"
          style={{
            background: "#0d0d0d",
            opacity: loadFading ? 0 : 1,
            transition: "opacity 0.5s ease-out",
          }}
        >
          <div className="relative" style={{ width: 96, height: 96 }}>
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                style={{ animation: "vsl-spin 2s linear infinite" }}
              >
                <circle cx="48" cy="48" r="42" stroke="#1a1a1a" strokeWidth="4" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="#00FF41"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - loadProgress / 100)}
                  transform="rotate(-90 48 48)"
                  style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
                />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: "#fff", fontWeight: 700, fontSize: "24px" }}
              >
                {Math.round(loadProgress)}%
              </div>
          </div>

          <style>{`@keyframes vsl-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Tap-to-unmute overlay — autoplay muted estilo Netflix */}
      {muted && !ended && loadHidden && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            startPlayback();
          }}
          aria-label="Ativar som"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/30 hover:bg-black/40 transition-colors group"
        >
          <div
            className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-[var(--shadow-glow)] group-hover:scale-110 transition-transform"
            style={{
              boxShadow:
                "0 0 24px var(--primary), 0 0 8px var(--primary), 0 6px 18px rgba(0,0,0,0.5)",
            }}
          >
            <VolumeX className="h-9 w-9 text-primary-foreground" />
          </div>
          <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-bold text-sm sm:text-base">
            Toque para ativar o som
          </span>
        </button>
      )}

      {/* aviso de falha removido a pedido do usuário */}

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
        <>
          {/* Pause/Play button — bottom-left */}
          {!embed && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              aria-label={paused ? "Reproduzir" : "Pausar"}
              className="absolute bottom-2 left-2 z-40 h-6 w-6 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
            >
              {paused ? <Play className="h-3 w-3 fill-current ml-[1px]" /> : <Pause className="h-3 w-3 fill-current" />}
            </button>
          )}

          {/* Seekable progress bar (only for direct <video>) */}
          {!embed ? (
            <div
              ref={progressBarRef}
              role="slider"
              aria-label="Progresso do vídeo"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); seekFromEvent(e.clientX); }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                seekFromEvent(e.clientX);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  seekFromEvent(e.clientX);
                }
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              className="absolute inset-x-0 bottom-0 z-30 h-3 flex items-end cursor-pointer touch-none group"
            >
              <div className="relative w-full h-1 group-hover:h-1.5 transition-[height] bg-white/20">
                <div
                  className="absolute inset-y-0 left-0 bg-primary"
                  style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px var(--primary), 0 0 4px var(--primary)",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `calc(${progress}% - 6px)`,
                    boxShadow: "0 0 8px var(--primary)",
                  }}
                />
              </div>
            </div>
          ) : (
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
        </>
      )}
    </div>
  );
}
