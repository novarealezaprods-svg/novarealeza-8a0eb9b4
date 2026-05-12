import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { type BeatItem, playUrl, pauseCurrent, useBeatSnap } from "@/components/BeatPlayer";

type GenreKey = "TRAP" | "FUNK" | "DRILL" | "BOOMBAP";

type GenreConfig = {
  key: GenreKey;
  label: string;
  emoji: string;
  color: string;
  pack100: number;
  pack300: number;
  match: (b: BeatItem) => boolean;
};

const GENRES: GenreConfig[] = [
  {
    key: "TRAP",
    label: "TRAP",
    emoji: "🎯",
    color: "#00FF41",
    pack100: 40,
    pack300: 121,
    match: (b) => {
      const n = (b.name || "").toLowerCase();
      return /trap|don toliver|ambient|hood|florida/.test(n) && !/boombap|drill|funk/.test(n);
    },
  },
  {
    key: "FUNK",
    label: "FUNK",
    emoji: "🔥",
    color: "#FF6B00",
    pack100: 40,
    pack300: 118,
    match: (b) => /funk|nave|favela/i.test(b.name || ""),
  },
  {
    key: "DRILL",
    label: "DRILL",
    emoji: "💥",
    color: "#FF3C3C",
    pack100: 3,
    pack300: 23,
    match: (b) => /drill|skrilla/i.test(b.name || ""),
  },
  {
    key: "BOOMBAP",
    label: "BOOMBAP",
    emoji: "🎵",
    color: "#3C9EFF",
    pack100: 9,
    pack300: 20,
    match: (b) => /boombap|rap|alee/i.test(b.name || ""),
  },
];

function fmt(s: number) {
  if (!isFinite(s) || s <= 0) return "—:—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function useDuration(url: string) {
  const [dur, setDur] = useState<number>(0);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const a = new Audio();
    a.preload = "metadata";
    a.src = url;
    const onMeta = () => { if (!cancelled) setDur(a.duration || 0); };
    a.addEventListener("loadedmetadata", onMeta);
    return () => {
      cancelled = true;
      a.removeEventListener("loadedmetadata", onMeta);
      try { a.src = ""; } catch {}
    };
  }, [url]);
  return dur;
}

function BeatRow({ beat, index, color }: { beat: BeatItem; index: number; color: string }) {
  const url = useMemo(() => normalizeDirectUrl(beat.url), [beat.url]);
  const snap = useBeatSnap();
  const duration = useDuration(url);

  const isActive = snap.activeUrl === url;
  const isLoading = snap.loadingUrl === url && !snap.isPlaying;
  const isPlaying = isActive && snap.isPlaying;

  const progress = isActive && snap.duration > 0
    ? Math.min(100, (snap.currentTime / Math.min(snap.duration, 60)) * 100)
    : 0;

  const toggle = () => {
    if (!url) return;
    if (isPlaying) pauseCurrent();
    else playUrl(url);
  };

  return (
    <div
      className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5 transition-colors"
      style={{ background: isActive ? "rgba(255,255,255,0.04)" : "transparent" }}
    >
      <div className="w-5 text-center text-xs font-semibold text-white/40 tabular-nums">
        {index + 1}
      </div>
      <button
        onClick={toggle}
        aria-label={isPlaying ? "Pausar" : "Tocar"}
        className="h-8 w-8 rounded-full flex items-center justify-center text-black flex-shrink-0 transition-transform hover:scale-105"
        style={{ background: color, boxShadow: isPlaying ? `0 0 12px ${color}80` : undefined }}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{beat.name}</div>
        {isActive && (
          <div className="mt-1 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-[width] duration-150"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
        )}
      </div>
      <div className="text-xs text-white/50 tabular-nums flex-shrink-0">
        {fmt(duration)}
      </div>
    </div>
  );
}

function PlaylistCard({ cfg, beats }: { cfg: GenreConfig; beats: BeatItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? beats : beats.slice(0, 3);

  return (
    <div
      className="rounded-2xl p-5 md:p-6 flex flex-col"
      style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${cfg.color}1a`, border: `1px solid ${cfg.color}40` }}
        >
          <span aria-hidden>{cfg.emoji}</span>
        </div>
        <h3
          className="text-[20px] font-bold text-white tracking-wide"
          style={{ textShadow: `0 0 18px ${cfg.color}30` }}
        >
          {cfg.label}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span
          className="text-[12px] font-semibold px-3 py-1"
          style={{
            borderRadius: 100,
            background: "rgba(0, 255, 65, 0.12)",
            border: "1px solid rgba(0, 255, 65, 0.35)",
            color: "#7dff9c",
          }}
        >
          {cfg.pack100} beats no Pack 100
        </span>
        <span
          className="text-[12px] font-semibold px-3 py-1"
          style={{
            borderRadius: 100,
            background: "rgba(120, 100, 255, 0.14)",
            border: "1px solid rgba(120, 100, 255, 0.4)",
            color: "#b8aaff",
          }}
        >
          {cfg.pack300} beats no Pack 300
        </span>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {visible.length > 0 ? (
          visible.map((b, i) => (
            <BeatRow key={`${b.url}-${i}`} beat={b} index={i} color={cfg.color} />
          ))
        ) : (
          <div className="text-sm text-white/40 py-4 text-center">
            Sem prévias disponíveis
          </div>
        )}
      </div>

      {beats.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full text-sm font-semibold py-2.5 rounded-lg transition-colors"
          style={{
            color: cfg.color,
            background: `${cfg.color}10`,
            border: `1px solid ${cfg.color}30`,
          }}
        >
          {expanded
            ? "Mostrar menos ↑"
            : `Ouvir mais beats de ${cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase()} →`}
        </button>
      )}
    </div>
  );
}

export function GenrePlaylists({ beats }: { beats: BeatItem[] }) {
  const grouped = useMemo(() => {
    const used = new Set<number>();
    const map = new Map<GenreKey, BeatItem[]>();
    GENRES.forEach((g) => map.set(g.key, []));
    GENRES.forEach((g) => {
      beats.forEach((b, i) => {
        if (used.has(i)) return;
        if (g.match(b)) {
          map.get(g.key)!.push(b);
          used.add(i);
        }
      });
    });
    // dump leftovers into TRAP
    beats.forEach((b, i) => {
      if (!used.has(i)) map.get("TRAP")!.push(b);
    });
    return map;
  }, [beats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
      {GENRES.map((g) => (
        <PlaylistCard key={g.key} cfg={g} beats={grouped.get(g.key) || []} />
      ))}
    </div>
  );
}