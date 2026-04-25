import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";

export type BeatItem = {
  name: string;
  url: string;
  key?: string;
  bpm?: number | string;
};

const PREVIEW_SECONDS = 60;

// Global registry to ensure only one beat plays at a time
const playingAudios = new Set<HTMLAudioElement>();

// Notify other players to reset their progress UI when a new beat starts
const beatStartListeners = new Set<(audio: HTMLAudioElement) => void>();

export function BeatPlayer({ beat, index }: { beat: BeatItem; index: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const listener = (audio: HTMLAudioElement) => {
      if (audio !== audioRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrent(0);
      }
    };
    beatStartListeners.add(listener);
    return () => {
      beatStartListeners.delete(listener);
    };
  }, []);

  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      if (a.currentTime >= previewEnd) a.currentTime = 0;
      playingAudios.forEach((other) => {
        if (other !== a) other.pause();
      });
      a.play().catch(() => {});
    }
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
        src={beat.url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={(e) => {
          playingAudios.forEach((other) => {
            if (other !== e.currentTarget) other.pause();
          });
          playingAudios.add(e.currentTarget);
          setPlaying(true);
          beatStartListeners.forEach((fn) => fn(e.currentTarget));
        }}
        onPause={(e) => {
          playingAudios.delete(e.currentTarget);
          setPlaying(false);
        }}
        onEnded={(e) => {
          playingAudios.delete(e.currentTarget);
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