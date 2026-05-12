import { useMemo, useState } from "react";
import { Play, Pause, Loader2, X } from "lucide-react";
import { playUrl, pauseCurrent, useBeatSnap, type BeatItem } from "@/components/BeatPlayer";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type GenreDef = {
  key: string;
  label: string;
  color: string;
  bg: string;
  pack100: number;
  pack300: number;
  match: (g?: string | null) => boolean;
};

const GENRES: GenreDef[] = [
  { key: "trap", label: "TRAP", color: "#00FF41", bg: "#111", pack100: 40, pack300: 121, match: (g) => /trap/i.test(g || "") },
  { key: "funk", label: "FUNK", color: "#FF6B00", bg: "#111", pack100: 40, pack300: 118, match: (g) => /funk/i.test(g || "") },
  { key: "drill", label: "DRILL", color: "#FF3C3C", bg: "#111", pack100: 3, pack300: 23, match: (g) => /drill/i.test(g || "") },
  { key: "boombap", label: "BOOMBAP", color: "#3C9EFF", bg: "#111", pack100: 9, pack300: 20, match: (g) => /boom\s*bap|boombap|rap/i.test(g || "") },
];

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function BeatRow({ beat, index, color }: { beat: BeatItem; index: number; color: string }) {
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
      <span className="text-xs tabular-nums w-5 text-right" style={{ color: isActive ? color : "rgba(255,255,255,0.4)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <button
        onClick={toggle}
        aria-label={isPlaying ? "Pausar" : "Tocar"}
        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
        style={{ background: color, color: "#000" }}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate text-white">{beat.name}</div>
        {isActive && (
          <div className="mt-1 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full transition-[width] duration-150 ease-linear" style={{ width: `${progress}%`, background: color }} />
          </div>
        )}
      </div>
      <span className="text-[11px] tabular-nums text-white/50 flex-shrink-0">
        {isActive ? fmt(snap.currentTime) : "0:60"}
      </span>
    </div>
  );
}

export function GenrePlaylists({ beats }: { beats: BeatItem[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = GENRES.find((g) => g.key === openKey) || null;
  const activeBeats = useMemo(
    () => (active ? beats.filter((b: any) => active.match(b.genre)) : []),
    [beats, active]
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" style={{ gap: 12 }}>
        {GENRES.map((g) => (
          <button
            key={g.key}
            onClick={() => setOpenKey(g.key)}
            className="group relative aspect-square w-full overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            style={{ borderRadius: 12, background: g.bg }}
          >
            {/* Hover darkening */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            {/* Bottom gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)" }}
            />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end items-start p-5 text-left">
              <h3 className="font-bold text-white uppercase" style={{ fontSize: 22, lineHeight: 1.1 }}>
                {g.label}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  style={{
                    background: "rgba(0,255,65,0.15)",
                    color: "#5dff8a",
                    border: "1px solid rgba(0,255,65,0.35)",
                    borderRadius: 100,
                    padding: "3px 9px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {g.pack100} no Pack 100
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>·</span>
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 100,
                    padding: "3px 9px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {g.pack300} no Pack 300
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!openKey} onOpenChange={(v) => !v && setOpenKey(null)}>
        <DialogContent
          className="max-w-lg p-0 gap-0 border-white/10"
          style={{ background: "#0d0d0d", borderRadius: 16 }}
        >
          {active && (
            <>
              <div
                className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                style={{ background: `linear-gradient(135deg, ${active.color}22, transparent)` }}
              >
                <div>
                  <DialogTitle className="text-white font-black text-2xl tracking-tight">
                    {active.label}
                  </DialogTitle>
                  <DialogDescription className="text-white/60 text-xs mt-1">
                    {active.pack100} no Pack 100 · {active.pack300} no Pack 300
                  </DialogDescription>
                </div>
                <button
                  onClick={() => setOpenKey(null)}
                  aria-label="Fechar"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-1">
                {activeBeats.length > 0 ? (
                  activeBeats.map((b, i) => (
                    <BeatRow key={`${b.name}-${i}`} beat={b} index={i} color={active.color} />
                  ))
                ) : (
                  <div className="text-sm text-white/50 text-center py-10">
                    Nenhum preview disponível para esse gênero.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
