import { useEffect, useRef, useState } from "react";
import { RotateCcw, Volume2, VolumeX, Loader2, Play, Pause } from "lucide-react";
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
  const [duration, setDuration] = useState(0);
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

  // Browsers block autoplay with sound. We start muted, then a click/tap
  // anywhere on the player unmutes (counts as a user gesture).
  const unmute = () => {
    setMuted(false);
    if (embed?.provider === "youtube") {
      const post = (msg: object) =>
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
      post({ event: "command", func: "unMute", args: [] });
      post({ event: "command", func: "setVolume", args: [100] });
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
      return;
    }
    if (videoRef.current) {
      try {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        void videoRef.current.play();
      } catch {}
    }
  };

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
    setPaused(false);
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

  return (
    <div className="relative w-full h-full bg-black" onClick={unmute}>
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
          onPlaying={() => { setLoading(false); setPaused(false); }}
          onPause={() => setPaused(true)}
          onPlay={() => setPaused(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
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
        <>
          {!embed ? (
            // Full controls bar for direct <video>
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 z-30 flex flex-col bg-gradient-to-t from-black/85 via-black/60 to-transparent pt-3"
            >
              {/* Seekable progress bar — touch area 44px, visual bar 6px */}
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
                className="relative w-full h-11 px-3 flex items-center cursor-pointer touch-none group"
              >
                <div className="relative w-full h-2 rounded-full bg-white/25 overflow-visible">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{
                      width: `${progress}%`,
                      boxShadow: "0 0 10px var(--primary), 0 0 4px var(--primary)",
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary"
                    style={{
                      left: `calc(${progress}% - 8px)`,
                      boxShadow: "0 0 10px var(--primary), 0 0 4px var(--primary)",
                    }}
                  />
                </div>
              </div>

              {/* Controls row — 56px height, 12px side padding */}
              <div className="flex items-center gap-3 px-3 pb-2 h-14">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  aria-label={paused ? "Reproduzir" : "Pausar"}
                  className="h-11 w-11 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center text-primary-foreground transition-colors flex-shrink-0"
                  style={{ boxShadow: "0 0 12px rgba(0, 255, 65, 0.35)" }}
                >
                  {paused
                    ? <Play className="h-5 w-5 fill-current ml-[2px]" />
                    : <Pause className="h-5 w-5 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); muted ? unmute() : (videoRef.current && (videoRef.current.muted = true), setMuted(true)); }}
                  aria-label={muted ? "Ativar som" : "Mutar"}
                  className="h-11 w-11 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </button>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const v = videoRef.current;
                    if (!v) return;
                    if (document.fullscreenElement) {
                      void document.exitFullscreen();
                    } else {
                      void v.requestFullscreen?.();
                    }
                  }}
                  aria-label="Tela cheia"
                  className="h-11 w-11 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 z-30 h-1.5 bg-white/15 pointer-events-none">
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
