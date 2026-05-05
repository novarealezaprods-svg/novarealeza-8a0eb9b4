import { useEffect, useRef, useState } from "react";
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

// Global registry of every BeatPlayer audio element on the page.
// Ensures only one beat can play at a time — when one starts, all others pause and reset.
const allAudios = new Set<HTMLAudioElement>();
let currentAudio: HTMLAudioElement | null = null;

function stopAllExcept(target: HTMLAudioElement | null) {
  allAudios.forEach((a) => {
    if (a !== target && !a.paused) {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {}
    }
  });
}

export function BeatPlayer({ beat, index }: { beat: BeatItem; index: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    allAudios.add(a);
    return () => {
      allAudios.delete(a);
      if (currentAudio === a) currentAudio = null;
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      return;
    }
    // Pause + reset every other beat before starting this one.
    stopAllExcept(a);
    if (a.currentTime >= previewEnd) a.currentTime = 0;
    currentAudio = a;
    a.play().catch((err) => {
      console.warn("Beat playback failed:", err);
    });
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

      <audio
        ref={audioRef}
        src={normalizeDirectUrl(beat.url)}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={(e) => {
          stopAllExcept(e.currentTarget);
          currentAudio = e.currentTarget;
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          if (currentAudio === e.currentTarget) currentAudio = null;
          setPlaying(false);
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          if (t >= PREVIEW_SECONDS) {
            e.currentTarget.pause();
            e.currentTarget.currentTime = PREVIEW_SECONDS;
          }
          setCurrent(t);
        }}
      />
    </Card>
  );
}