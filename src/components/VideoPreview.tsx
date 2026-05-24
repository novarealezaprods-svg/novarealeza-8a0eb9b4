import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { RotateCcw, VolumeX, Play, Pause } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const [bufferPct, setBufferPct] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytDuration = useRef(0);
  const pollRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const ignoreToggleUntilRef = useRef(0);
  const audioGestureAtRef = useRef(0);
  const isStartingPlaybackRef = useRef(false);

  useEffect(() => {
    setEnded(false);
    setProgress(0);
    setMuted(true);
    setPaused(false);
  }, [embed, directUrl, url]);

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
    ignoreToggleUntilRef.current = Date.now() + 1200;
    if (embed?.provider === "youtube") {
      setMuted(false);
      setPaused(false);
      const post = (msg: object) =>
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
      post({ event: "command", func: "unMute", args: [] });
      post({ event: "command", func: "setVolume", args: [100] });
      post({ event: "command", func: "playVideo", args: [] });
      return;
    }
    if (embed?.provider === "vimeo") {
      setMuted(false);
      setPaused(false);
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
        const v = videoRef.current;
        isStartingPlaybackRef.current = true;
        v.muted = false;
        v.volume = 1;
        try { v.currentTime = 0; } catch {}
        setProgress(0);
        setLoading(false);
        const playPromise = v.play();

        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              setMuted(false);
              setPaused(false);
            })
            .catch(() => {
              v.muted = true;
            })
            .finally(() => {
              isStartingPlaybackRef.current = false;
            });
          return;
        }

        setMuted(false);
        setPaused(false);
        isStartingPlaybackRef.current = false;
      } catch {
        if (videoRef.current) videoRef.current.muted = true;
        isStartingPlaybackRef.current = false;
      }
    }
  };

  const handleAudioButtonInteraction = (
    e: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (isStartingPlaybackRef.current || now - audioGestureAtRef.current < 400) return;

    audioGestureAtRef.current = now;
    startPlayback();
  };

  useEffect(() => {
    if (embed || !videoRef.current) return;
    const v = videoRef.current;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  }, [embed, directUrl, reloadKey]);

  // Simulated Netflix-style loading percentage while buffering
  useEffect(() => {
    if (!loading) return;
    setBufferPct(0);
    let pct = 0;
    const id = window.setInterval(() => {
      // ease toward 95%, never reach 100 until actually playing
      const remaining = 95 - pct;
      pct = Math.min(95, pct + Math.max(0.5, remaining * 0.08));
      setBufferPct(pct);
    }, 120);
    return () => window.clearInterval(id);
  }, [loading, reloadKey]);

  const replay = () => {
    setEnded(false);
    setProgress(0);
    setLoading(false);
    setPaused(false);
    setMuted(true);
    setReloadKey((k) => k + 1);
  };

  const togglePlay = () => {
    if (Date.now() < ignoreToggleUntilRef.current) return;
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
          preload="metadata"
          playsInline
          onClick={(e) => {
            if (Date.now() < ignoreToggleUntilRef.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }

            if (!muted) togglePlay();
          }}
          onEnded={() => setEnded(true)}
          onPlaying={() => {
            setLoading(false);
            setPaused(false);
          }}
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
          onWaiting={() => {}}
          onLoadedMetadata={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => setLoading(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) setProgress((v.currentTime / v.duration) * 100);
          }}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        />
      )}

      {/* Netflix-style loading overlay com porcentagem */}
      {loading && !ended && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-black">
          <div className="relative h-24 w-24">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.12)" strokeWidth="6" fill="none" />
              <circle
                cx="50" cy="50" r="44"
                stroke="#00FF41"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - bufferPct / 100)}
                style={{
                  transition: "stroke-dashoffset 150ms linear",
                  filter: "drop-shadow(0 0 6px #00FF41)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xl tabular-nums">
              {Math.floor(bufferPct)}%
            </div>
          </div>
        </div>
      )}

      {/* Tap-to-unmute overlay — autoplay muted estilo Netflix */}
      {muted && !ended && !loading && (
        <button
          type="button"
          onPointerUp={handleAudioButtonInteraction}
          onClick={handleAudioButtonInteraction}
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
