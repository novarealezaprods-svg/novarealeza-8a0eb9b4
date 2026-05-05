import { useEffect, useMemo, useState } from "react";
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

type PlaybackSnapshot = {
  activeUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
};

const listeners = new Set<() => void>();

let globalAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playbackSnapshot: PlaybackSnapshot = {
  activeUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

function emitPlaybackChange() {
  listeners.forEach((listener) => listener());
}

function updatePlaybackSnapshot(partial?: Partial<PlaybackSnapshot>) {
  const audio = globalAudio;
  playbackSnapshot = {
    activeUrl: currentUrl,
    isPlaying: audio ? !audio.paused && !!currentUrl : false,
    currentTime: audio && currentUrl ? audio.currentTime : 0,
    duration: audio && currentUrl ? audio.duration || 0 : 0,
    ...partial,
  };
  emitPlaybackChange();
}

function getGlobalAudio() {
  if (typeof window === "undefined") return null;
  if (globalAudio) return globalAudio;

  globalAudio = new Audio();
  globalAudio.preload = "metadata";

  globalAudio.addEventListener("play", () => {
    updatePlaybackSnapshot({ isPlaying: true });
  });

  globalAudio.addEventListener("pause", () => {
    updatePlaybackSnapshot({ isPlaying: false });
  });

  globalAudio.addEventListener("loadedmetadata", () => {
    updatePlaybackSnapshot({ duration: globalAudio?.duration || 0 });
  });

  globalAudio.addEventListener("timeupdate", () => {
    if (!globalAudio || !currentUrl) return;

    if (globalAudio.currentTime >= PREVIEW_SECONDS) {
      globalAudio.pause();
      globalAudio.currentTime = PREVIEW_SECONDS;
      updatePlaybackSnapshot({ currentTime: PREVIEW_SECONDS, isPlaying: false });
      return;
    }

    updatePlaybackSnapshot({ currentTime: globalAudio.currentTime });
  });

  globalAudio.addEventListener("ended", () => {
    if (!globalAudio) return;
    globalAudio.currentTime = 0;
    updatePlaybackSnapshot({ currentTime: 0, isPlaying: false });
  });

  return globalAudio;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function playBeat(url: string) {
  const audio = getGlobalAudio();
  if (!audio) return;

  const nextUrl = normalizeDirectUrl(url);
  const shouldReplaceSource = currentUrl !== nextUrl || audio.src !== nextUrl;

  audio.pause();

  if (shouldReplaceSource) {
    audio.src = nextUrl;
  }

  currentUrl = nextUrl;
  audio.currentTime = 0;
  updatePlaybackSnapshot({ activeUrl: currentUrl, currentTime: 0, duration: audio.duration || 0 });

  audio.play().catch((err) => {
    console.warn("Beat playback failed:", err);
    updatePlaybackSnapshot({ isPlaying: false });
  });
}

function pauseBeat(url: string) {
  const audio = getGlobalAudio();
  const normalizedUrl = normalizeDirectUrl(url);
  if (!audio || currentUrl !== normalizedUrl) return;
  audio.pause();
}

export function BeatPlayer({ beat, index }: { beat: BeatItem; index: number }) {
  const beatUrl = useMemo(() => normalizeDirectUrl(beat.url), [beat.url]);
  const [snapshot, setSnapshot] = useState<PlaybackSnapshot>(playbackSnapshot);

  useEffect(() => {
    return subscribe(() => {
      setSnapshot({ ...playbackSnapshot });
    });
  }, []);

  useEffect(() => {
    getGlobalAudio();
  }, []);

  const playing = snapshot.activeUrl === beatUrl && snapshot.isPlaying;
  const current = snapshot.activeUrl === beatUrl ? snapshot.currentTime : 0;
  const duration = snapshot.activeUrl === beatUrl ? snapshot.duration : 0;

  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  const toggle = () => {
    if (playing) {
      pauseBeat(beatUrl);
      return;
    }
    playBeat(beatUrl);
  };

  return (
    <Card className="p-5 border-border/60 bg-card hover:border-primary/40 transition-colors flex flex-col items-center text-center relative overflow-hidden">
      {/* progress ring background */}
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-primary transition-all"
        style={{ width: `${progress * 100}%` }}
      />
        <button
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition mb-3"
        >
        {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
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

    </Card>
  );
}