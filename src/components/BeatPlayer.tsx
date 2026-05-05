import { useEffect, useState, useSyncExternalStore } from "react";
import { Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { normalizeDirectUrl } from "@/lib/normalize-url";

export type BeatItem = {
  name: string;
  url: string;
  key?: string;
  bpm?: number | string;
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

export function BeatPlayer({ beat }: { beat: BeatItem; index?: number }) {
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

  return (
    <Card className="p-5 border-border/60 bg-card hover:border-primary/40 transition-colors flex flex-col items-center text-center relative overflow-hidden">
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-primary transition-all"
        style={{ width: `${progress * 100}%` }}
      />
      <button
        onClick={toggle}
        aria-label={isPlaying ? "Pausar" : "Tocar"}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition mb-3 disabled:opacity-60"
        disabled={!resolvedUrl}
      >
        {isPlaying ? (
          <Pause className="h-6 w-6 fill-current" />
        ) : (
          <Play className="h-6 w-6 fill-current ml-0.5" />
        )}
      </button>

      {beat.bpm && (
        <div className="text-base font-bold leading-tight">{beat.bpm} BPM</div>
      )}
      {beat.key && (
        <div className="text-xs text-muted-foreground mt-0.5">{beat.key}</div>
      )}
      {!beat.bpm && !beat.key && (
        <div className="text-sm font-semibold truncate max-w-full">{beat.name}</div>
      )}

      {hasError && (
        <div className="mt-2 text-[10px] text-destructive leading-tight">
          Áudio indisponível
        </div>
      )}
      {isLoading && !hasError && (
        <div className="mt-2 text-[10px] text-muted-foreground leading-tight">
          Carregando…
        </div>
      )}
    </Card>
  );
}
