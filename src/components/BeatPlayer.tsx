import { useEffect, useState, useSyncExternalStore } from "react";
import { Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { normalizeDirectUrl } from "@/lib/normalize-url";

export type BeatItem = {
  name: string;
  url: string;
  key?: string;
  bpm?: number | string;
  image_url?: string | null;
};

const PREVIEW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Single global audio controller shared by every BeatPlayer on the page.
// All 10 (or N) players read/write through this — there is only ever ONE
// HTMLAudioElement instance in the document, which avoids browser limits on
// concurrent media elements and guarantees only one beat plays at a time.
// ---------------------------------------------------------------------------

type ControllerState = {
  activeUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loadingUrl: string | null;
  errorUrl: string | null;
};

let state: ControllerState = {
  activeUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  loadingUrl: null,
  errorUrl: null,
};

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const getSnapshot = () => state;
const setState = (patch: Partial<ControllerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((cb) => cb());
};

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;

  const el = new Audio();
  el.preload = "none";

  el.addEventListener("playing", () => {
    setState({ isPlaying: true, loadingUrl: null });
  });
  el.addEventListener("pause", () => {
    setState({ isPlaying: false });
  });
  el.addEventListener("loadedmetadata", () => {
    setState({ duration: el.duration || 0 });
  });
  el.addEventListener("timeupdate", () => {
    if (el.currentTime >= PREVIEW_SECONDS) {
      el.pause();
      el.currentTime = 0;
      setState({ currentTime: 0, isPlaying: false, activeUrl: null });
      return;
    }
    setState({ currentTime: el.currentTime });
  });
  el.addEventListener("ended", () => {
    el.currentTime = 0;
    setState({ currentTime: 0, isPlaying: false, activeUrl: null });
  });
  el.addEventListener("error", () => {
    const failed = state.activeUrl;
    console.warn("[BeatPlayer] Falha ao carregar áudio:", failed, el.error);
    setState({
      isPlaying: false,
      loadingUrl: null,
      errorUrl: failed,
      activeUrl: null,
      currentTime: 0,
      duration: 0,
    });
  });

  audio = el;
  return audio;
}

function playUrl(url: string) {
  const el = getAudio();
  if (!el) return;

  // If this beat is already the active source, just resume.
  if (state.activeUrl === url && el.src) {
    setState({ loadingUrl: url, errorUrl: null });
    el.play().catch((err) => {
      console.warn("[BeatPlayer] play() rejeitado:", err);
      setState({ loadingUrl: null, isPlaying: false });
    });
    return;
  }

  // Switching beat: hard reset of the single global element.
  try {
    el.pause();
  } catch {}
  el.removeAttribute("src");
  try {
    el.load();
  } catch {}

  el.src = url;
  el.currentTime = 0;
  setState({
    activeUrl: url,
    loadingUrl: url,
    errorUrl: null,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  });

  el.play().catch((err) => {
    console.warn("[BeatPlayer] play() rejeitado:", err);
    setState({ loadingUrl: null, isPlaying: false });
  });
}

function pauseCurrent() {
  const el = audio;
  if (!el) return;
  try {
    el.pause();
  } catch {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function BeatPlayer({
  beat,
  index = 0,
  displayName,
  genre,
}: {
  beat: BeatItem;
  index?: number;
  displayName?: string;
  genre?: string;
}) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  useEffect(() => {
    setResolvedUrl(normalizeDirectUrl(beat.url));
  }, [beat.url]);

  const isActive = snap.activeUrl === resolvedUrl;
  const isLoading = snap.loadingUrl === resolvedUrl && !snap.isPlaying;
  const isPlaying = isActive && snap.isPlaying;
  const hasError = snap.errorUrl === resolvedUrl;

  const current = isActive ? snap.currentTime : 0;
  const duration = isActive ? snap.duration : 0;
  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  const toggle = () => {
    if (!resolvedUrl) return;
    if (isPlaying) {
      pauseCurrent();
      return;
    }
    playUrl(resolvedUrl);
  };

  const name = displayName || beat.name;
  const bgImage = beat.image_url || null;

  return (
    <div
      className="beat-card-anim group relative flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 p-3 md:p-5 h-[180px] md:h-auto md:min-h-0"
      style={{
        background: bgImage
          ? `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%), url("${bgImage}") center/cover no-repeat`
          : "#111111",
        border: `1px solid ${isPlaying ? "#39FF14" : "#222222"}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: isPlaying
          ? "0 0 0 1px #39FF14, 0 0 24px rgba(57,255,20,0.25), 0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.4)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {genre && (
        <span
          className="absolute top-2 left-2 z-10 text-[10px] md:self-start md:static"
          style={{
            background: "#0a2e0a",
            color: "#39FF14",
            fontWeight: 700,
            textTransform: "uppercase",
            borderRadius: 4,
            padding: "3px 8px",
            letterSpacing: "0.05em",
          }}
        >
          {genre}
        </span>
      )}

      <div
        className="text-center text-white truncate text-[12px] md:text-base mt-0 md:mt-3 px-2 py-1 rounded self-stretch"
        style={{
          fontWeight: 800,
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
          background: "rgba(0,0,0,0.6)",
        }}
      >
        {name}
      </div>

      <div className="flex justify-center my-1 md:my-4">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          disabled={!resolvedUrl}
          className={`h-11 w-11 md:h-16 md:w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition disabled:opacity-60 ${
            isPlaying ? "beat-pulse" : ""
          }`}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 md:h-7 md:w-7 fill-current" />
          ) : (
            <Play className="h-5 w-5 md:h-7 md:w-7 fill-current ml-0.5" />
          )}
        </button>
      </div>

      <div className="text-center text-[11px] md:text-[13px] inline-block self-center px-2 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)" }}>
        {beat.bpm && (
          <span style={{ color: "#fff", fontWeight: 700 }}>{beat.bpm} BPM</span>
        )}
        {beat.bpm && beat.key && <span style={{ color: "#bbb", margin: "0 6px" }}>·</span>}
        {beat.key && <span style={{ color: "#bbb", fontWeight: 400 }}>{beat.key}</span>}
      </div>

      <div
        className="mt-2 md:mt-3 w-full overflow-hidden"
        style={{ background: "#222222", height: 3, borderRadius: 4 }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: "#39FF14",
            borderRadius: 4,
            transition: "width 0.15s linear",
          }}
        />
      </div>

      <div className="flex justify-between mt-1.5" style={{ fontSize: 11, color: "#666" }}>
        <span>{formatTime(current)}</span>
        <span>{formatTime(previewEnd)}</span>
      </div>

      {hasError && (
        <div className="mt-2 text-[10px] text-destructive leading-tight text-center">
          Áudio indisponível — reenvie pelo /admin
        </div>
      )}
      {isLoading && !hasError && (
        <div className="mt-2 text-[10px] text-muted-foreground leading-tight text-center">
          Carregando…
        </div>
      )}
    </div>
  );
}
