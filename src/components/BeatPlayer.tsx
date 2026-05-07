import { useEffect, useState, useSyncExternalStore } from "react";
import { Play, Pause } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
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
  el.preload = "auto";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setResolvedUrl(normalizeDirectUrl(beat.url));
  }, [beat.url]);

  const isActive = snap.activeUrl === resolvedUrl;
  const isLoading = snap.loadingUrl === resolvedUrl && !snap.isPlaying;
  const isPlaying = isActive && snap.isPlaying;
  const hasError = snap.errorUrl === resolvedUrl;

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
    <>
    <div
      onClick={() => setOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}
      className="beat-card-anim group relative flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 p-3 md:p-5 aspect-square cursor-pointer"
      style={{
        background: bgImage
          ? `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%), url("${bgImage}") center/cover no-repeat`
          : "#111111",
        border: `1px solid ${isPlaying ? "#39FF14" : "#222222"}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: isPlaying
          ? "0 0 0 1px #39FF14, 0 0 24px rgba(57,255,20,0.25), 0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.4)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div
        className="text-center text-white truncate text-[12px] md:text-base self-center"
        style={{
          fontWeight: 700,
          textTransform: "uppercase",
          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
          background: "rgba(0,0,0,0.5)",
          padding: "4px 8px",
          borderRadius: 6,
          maxWidth: "100%",
        }}
      >
        {name}
      </div>

      <div className="flex justify-center my-1 md:my-4">
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
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

      {(beat.bpm || beat.key) && (
        <div
          className="text-center self-center text-white"
          style={{
            fontSize: 10,
            background: "rgba(0,0,0,0.45)",
            padding: "3px 8px",
            borderRadius: 4,
          }}
        >
          {beat.bpm && <span style={{ fontWeight: 700 }}>{beat.bpm} BPM</span>}
          {beat.bpm && beat.key && <span style={{ margin: "0 6px", opacity: 0.7 }}>·</span>}
          {beat.key && <span>{beat.key}</span>}
        </div>
      )}

      {hasError && (
        <div className="mt-2 text-[10px] text-destructive leading-tight text-center">
          Áudio indisponível — reenvie pelo /admin
        </div>
      )}
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="beat-dialog-overlay fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <DialogPrimitive.Content
          className="beat-dialog-content pointer-events-auto relative w-full max-w-md border border-border bg-card p-0 overflow-hidden rounded-lg shadow-2xl"
        >
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div
          className="relative w-full aspect-square flex flex-col justify-between p-5"
          style={{
            background: bgImage
              ? `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%), url("${bgImage}") center/cover no-repeat`
              : "#111111",
          }}
        >
          <div
            className="text-center text-white self-center text-sm md:text-lg"
            style={{
              fontWeight: 700,
              textTransform: "uppercase",
              background: "rgba(0,0,0,0.5)",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            {name}
          </div>

          <div className="flex justify-center">
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              disabled={!resolvedUrl}
              className={`h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition disabled:opacity-60 ${
                isPlaying ? "beat-pulse" : ""
              }`}
            >
              {isPlaying ? <Pause className="h-9 w-9 fill-current" /> : <Play className="h-9 w-9 fill-current ml-1" />}
            </button>
          </div>

          {(beat.bpm || beat.key) && (
            <div
              className="text-center self-center text-white"
              style={{
                fontSize: 12,
                background: "rgba(0,0,0,0.45)",
                padding: "4px 10px",
                borderRadius: 4,
              }}
            >
              {beat.bpm && <span style={{ fontWeight: 700 }}>{beat.bpm} BPM</span>}
              {beat.bpm && beat.key && <span style={{ margin: "0 6px", opacity: 0.7 }}>·</span>}
              {beat.key && <span>{beat.key}</span>}
            </div>
          )}
          </div>
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-sm opacity-80 hover:opacity-100 transition bg-black/40 p-1.5 z-10">
            <X className="h-4 w-4 text-white" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </Dialog>
    </>
  );
}
