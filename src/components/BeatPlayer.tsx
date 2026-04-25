import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type BeatItem = {
  name: string;
  url: string;
  key?: string;
  bpm?: number | string;
};

const PREVIEW_SECONDS = 60;
const BARS = 64;

// Global registry to ensure only one beat plays at a time
const playingAudios = new Set<HTMLAudioElement>();

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function BeatPlayer({ beat, index }: { beat: BeatItem; index: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  // Generate waveform peaks from audio buffer
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(beat.url);
        const buf = await res.arrayBuffer();
        const AC: typeof AudioContext =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));
        const channel = audioBuf.getChannelData(0);
        const block = Math.floor(channel.length / BARS);
        const result: number[] = [];
        for (let i = 0; i < BARS; i++) {
          let sum = 0;
          for (let j = 0; j < block; j++) {
            sum += Math.abs(channel[i * block + j] || 0);
          }
          result.push(sum / block);
        }
        const max = Math.max(...result, 0.0001);
        if (!cancelled) setPeaks(result.map((v) => v / max));
        ctx.close();
      } catch {
        // fallback random peaks
        if (!cancelled) {
          const rand = Array.from({ length: BARS }, () => 0.3 + Math.random() * 0.7);
          setPeaks(rand);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [beat.url]);

  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      if (a.currentTime >= previewEnd) a.currentTime = 0;
      // Pause any other audio currently playing
      playingAudios.forEach((other) => {
        if (other !== a) other.pause();
      });
      a.play().catch(() => {});
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !previewEnd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(previewEnd - 0.05, x * previewEnd));
  };

  return (
    <Card className="p-4 border-border/60 bg-card hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition flex-shrink-0"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="text-sm font-bold truncate">
              <span className="text-muted-foreground mr-2">#{String(index + 1).padStart(2, "0")}</span>
              {beat.name}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {beat.key && (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-2 py-0">
                  {beat.key}
                </Badge>
              )}
              {beat.bpm && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-2 py-0 border-accent/40 text-accent">
                  {beat.bpm} BPM
                </Badge>
              )}
            </div>
          </div>

          {/* Waveform */}
          <div
            onClick={seek}
            className="relative h-12 cursor-pointer flex items-center gap-[2px] select-none"
          >
            {(peaks || Array.from({ length: BARS }, () => 0.5)).map((p, i) => {
              const barProgress = i / BARS;
              const active = barProgress <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors ${active ? "bg-primary" : "bg-muted-foreground/30"}`}
                  style={{ height: `${Math.max(8, p * 100)}%` }}
                />
              );
            })}
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{formatTime(current)}</span>
            <span className="uppercase tracking-widest text-[10px]">Preview · 1 min</span>
            <span>{formatTime(previewEnd)}</span>
          </div>
        </div>
      </div>

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