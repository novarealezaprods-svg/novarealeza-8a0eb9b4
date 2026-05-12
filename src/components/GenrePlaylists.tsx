import { useMemo, useState } from "react";
import { Play, Pause, Loader2, ChevronDown } from "lucide-react";
import { playUrl, pauseCurrent, useBeatSnap, type BeatItem } from "@/components/BeatPlayer";
import { normalizeDirectUrl } from "@/lib/normalize-url";

type GenreDef = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  pack100: number;
  pack300: number;
  match: (g?: string | null) => boolean;
};

const GENRES: GenreDef[] = [
  {
    key: "trap",
    label: "TRAP",
    emoji: "🔥",
    color: "#00FF41",
    pack100: 40,
    pack300: 121,
    match: (g) => /trap/i.test(g || ""),
  },
  {
    key: "funk",
    label: "FUNK",
    emoji: "🎵",
    color: "#FF6B00",
    pack100: 40,
    pack300: 118,
    match: (g) => /funk/i.test(g || ""),
  },
  {
    key: "drill",
    label: "DRILL",
    emoji: "🗡️",
    color: "#FF3C3C",
    pack100: 3,
    pack300: 23,
    match: (g) => /drill/i.test(g || ""),
  },
  {
    key: "boombap",
    label: "BOOMBAP",
    emoji: "🎤",
    color: "#3C9EFF",
    pack100: 9,
    pack300: 20,
    match: (g) => /boom\s*bap|boombap|rap/i.test(g || ""),
  },
];

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function BeatRow({
  beat,
  index,
  color,
}: {
  beat: BeatItem;
  index: number;
  color: string;
}) {
  const snap = useBeatSnap();
  const url = normalizeDirectUrl(beat.url);
  const isActive = snap.activeUrl === url;
  const isPlaying = isActive && snap.isPlaying;
  const isLoading = snap.loadingUrl === url && !snap.isPlaying;
  const progress =
    isActive && snap.duration > 0
      ? Math.min(100, (snap.currentTime / Math.min(60, snap.duration)) * 100)
      : 0;

  const toggle = () => {
    if (!url) return;
    if (isPlaying) pauseCurrent();
    else playUrl(url);
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
      style={{ background: isActive ? "rgba(255,255,255,0.04)" : "transparent" }}
    >
      <span
        className="text-xs tabular-nums w-5 text-right"
        style={{ color: isActive ? color : "rgba(255,255,255,0.4)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <button
        onClick={toggle}
        aria-label={isPlaying ? "Pausar" : "Tocar"}
        className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
        style={{ background: color, color: "#000" }}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold truncate"
          style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.9)" }}
        >
          {beat.name}
        </div>
        {isActive && (
          <div className="mt-1 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full transition-[width] duration-150 ease-linear"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>
        )}
      </div>
      <span className="text-[11px] tabular-nums text-white/50 flex-shrink-0">
        {isActive ? fmt(snap.currentTime) : "0:60"}
      </span>
    </div>
  );
}

function PlaylistCard({ def, beats }: { def: GenreDef; beats: BeatItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(
    () => beats.filter((b: any) => def.match(b.genre)),
    [beats, def]
  );
  const preview = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const visible = expanded ? filtered : preview;

  return (
    <div
      className="flex flex-col p-5 md:p-6"
      style={{
        background: "#0d0d0d",
        border: "1px solid #1a1a1a",
        borderRadius: 16,
        boxShadow: `0 0 0 1px transparent, inset 0 1px 0 rgba(255,255,255,0.02)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden="true">
            {def.emoji}
          </span>
          <div>
            <h3
              className="font-bold text-white"
              style={{ fontSize: 20, letterSpacing: "0.02em" }}
            >
              {def.label}
            </h3>
            <div className="text-[11px] uppercase tracking-widest text-white/40 mt-0.5">
              Playlist
            </div>
          </div>
        </div>
        <span
          className="h-2.5 w-2.5 rounded-full mt-2 flex-shrink-0"
          style={{ background: def.color, boxShadow: `0 0 12px ${def.color}` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <span
          className="inline-flex items-center"
          style={{
            background: "rgba(0, 255, 65, 0.12)",
            color: "#5dff8a",
            border: "1px solid rgba(0, 255, 65, 0.3)",
            borderRadius: 100,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {def.pack100} beats no Pack 100
        </span>
        <span
          className="inline-flex items-center"
          style={{
            background: "rgba(124, 92, 255, 0.15)",
            color: "#b9a8ff",
            border: "1px solid rgba(124, 92, 255, 0.35)",
            borderRadius: 100,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {def.pack300} beats no Pack 300
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-1">
        {visible.length > 0 ? (
          visible.map((b, i) => (
            <BeatRow key={`${b.name}-${i}`} beat={b} index={i} color={def.color} />
          ))
        ) : (
          <div className="text-xs text-white/40 px-3 py-4 text-center">
            Nenhum preview disponível.
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80 self-start"
          style={{ color: def.color }}
        >
          <ChevronDown
            className="h-4 w-4 transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "none" }}
          />
          <span>
            {expanded
              ? `Ocultar beats de ${def.label}`
              : `Ouvir mais beats de ${def.label} →`}
          </span>
        </button>
      )}
    </div>
  );
}

export function GenrePlaylists({ beats }: { beats: BeatItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
      {GENRES.map((g) => (
        <PlaylistCard key={g.key} def={g} beats={beats} />
      ))}
    </div>
  );
}