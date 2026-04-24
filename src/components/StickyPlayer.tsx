import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Music2 } from "lucide-react";
import type { BeatItem } from "@/components/BeatPlayer";

const BARS = 96;
const PREVIEW_SECONDS = 60;

function formatTime(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function StickyPlayer({ beats }: { beats: BeatItem[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  const beat = beats[index];

  useEffect(() => {
    setPeaks(null);
    setCurrent(0);
    if (!beat) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(beat.url);
        const buf = await res.arrayBuffer();
        const AC: typeof AudioContext =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const audioBuf = await ctx.decodeAudioData(buf.slice(0));
        const channel = audioBuf.getChannelData(0);
        const block = Math.floor(channel.length / BARS);
        const result: number[] = [];
        for (let i = 0; i < BARS; i++) {
          let sum = 0;
          for (let j = 0; j < block; j++) sum += Math.abs(channel[i * block + j] || 0);
          result.push(sum / block);
        }
        const max = Math.max(...result, 0.0001);
        if (!cancelled) setPeaks(result.map((v) => v / max));
        ctx.close();
      } catch {
        if (!cancelled) setPeaks(Array.from({ length: BARS }, () => 0.3 + Math.random() * 0.7));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [beat?.url]);

  if (!beat) return null;

  const previewEnd = Math.min(PREVIEW_SECONDS, duration || PREVIEW_SECONDS);
  const progress = previewEnd ? Math.min(current / previewEnd, 1) : 0;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else {
      if (a.currentTime >= previewEnd) a.currentTime = 0;
      a.play().catch(() => {});
    }
  };

  const prev = () => setIndex((i) => (i - 1 + beats.length) % beats.length);
  const next = () => setIndex((i) => (i + 1) % beats.length);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !previewEnd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(previewEnd - 0.05, x * previewEnd));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/85 backdrop-blur-xl shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.6)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 w-[180px] sm:w-[220px] flex-shrink-0">
            <div className="h-11 w-11 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Music2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{beat.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {beat.key ? `${beat.key} · ` : ""}
                {beat.bpm ? `${beat.bpm} BPM` : "Preview"}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={prev}
              aria-label="Anterior"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={playing ? "Pausar" : "Tocar"}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 hover:scale-105 active:scale-100 transition"
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              aria-label="Próximo"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
          </div>

          {/* Waveform + time */}
          <div className="flex-1 min-w-0">
            <div
              onClick={seek}
              className="relative h-10 cursor-pointer flex items-center gap-[2px] select-none"
            >
              {(peaks || Array.from({ length: BARS }, () => 0.5)).map((p, i) => {
                const barProgress = i / BARS;
                const active = barProgress <= progress;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors ${
                      active
                        ? "bg-primary shadow-[0_0_6px_var(--primary)]"
                        : "bg-muted-foreground/25"
                    }`}
                    style={{ height: `${Math.max(10, p * 100)}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>{formatTime(current)}</span>
              <span className="hidden sm:inline uppercase tracking-widest text-[10px]">
                Preview · 1 min
              </span>
              <span>{formatTime(previewEnd)}</span>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={beat.url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          next();
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
    </div>
  );
}
