import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Loader2, X, Hand } from "lucide-react";
import { playUrl, pauseCurrent, useBeatSnap, type BeatItem } from "@/components/BeatPlayer";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type GenreDef = {
  key: string;
  label: string;
  color: string;
  pack100: number;
  pack300: number;
  match: (g?: string | null) => boolean;
};

const GENRES: GenreDef[] = [
  { key: "TRAP", label: "TRAP", color: "#19C63C", pack100: 40, pack300: 121, match: (g) => /trap/i.test(g || "") },
  { key: "FUNK", label: "FUNK", color: "#FF6B00", pack100: 40, pack300: 118, match: (g) => /funk/i.test(g || "") },
  { key: "DRILL", label: "DRILL", color: "#F90A1F", pack100: 3, pack300: 23, match: (g) => /drill/i.test(g || "") },
  { key: "BOOMBAP", label: "BOOMBAP", color: "#3C9EFF", pack100: 9, pack300: 20, match: (g) => /\b(boom\s*bap|boombap|rap)\b/i.test(g || "") },
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
  delayMs,
}: {
  beat: BeatItem;
  index: number;
  color: string;
  delayMs: number;
}) {
  const snap = useBeatSnap();
  const url = normalizeDirectUrl(beat.url);
  const isActive = snap.activeUrl === url;
  const isPlaying = isActive && snap.isPlaying;
  const isLoading = snap.loadingUrl === url && !snap.isPlaying;

  const toggle = () => {
    if (!url) return;
    if (isPlaying) pauseCurrent();
    else playUrl(url);
  };

  return (
    <div
      onClick={toggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
      className="gp-row group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
      style={
        {
          animationDelay: `${delayMs}ms`,
          background: isActive ? "rgba(0,255,65,0.10)" : "transparent",
          boxShadow: isActive ? "inset 3px 0 0 #19C63C" : "none",
          cursor: "pointer",
        } as React.CSSProperties
      }
    >
      <span
        className="text-xs tabular-nums w-5 text-right flex-shrink-0"
        style={{ color: isActive ? "#19C63C" : "rgba(255,255,255,0.4)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Thumbnail 56x56 */}
      <div
        className="flex-shrink-0 overflow-hidden bg-[#1a1a1a]"
        style={{ width: 56, height: 56, borderRadius: 8 }}
      >
        {beat.image_url ? (
          <img
            src={beat.image_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[10px] text-white/30"
            style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}
          >
            ♪
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold truncate"
          style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.95)" }}
        >
          {beat.name}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
          {beat.bpm && <span>{beat.bpm} BPM</span>}
          {beat.bpm && beat.key && <span className="opacity-60">·</span>}
          {beat.key && <span>{beat.key}</span>}
          {!beat.bpm && !beat.key && <span>Preview 60s</span>}
        </div>
      </div>

      <span className="text-[11px] tabular-nums text-white/50 flex-shrink-0 w-9 text-right">
        {isActive ? fmt(snap.currentTime) : "0:60"}
      </span>

      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        aria-label={isPlaying ? "Pausar" : "Tocar"}
        className="relative h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
        style={{ background: isPlaying ? "#19C63C" : color, color: "#000" }}
      >
        {isPlaying && (
          <>
            <span className="gp-wave" />
            <span className="gp-wave gp-wave-2" />
          </>
        )}
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current relative" />
        ) : isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>
    </div>
  );
}

export function GenrePlaylists({ beats }: { beats: BeatItem[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [showHint, setShowHint] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem("playlist_hint_seen_v1") === "1") return;
    } catch {}
    const el = gridRef.current;
    if (!el) return;
    let timer: number | null = null;
    let hideTimer: number | null = null;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible && timer === null) {
          timer = window.setTimeout(() => {
            setShowHint(true);
            try { window.localStorage.setItem("playlist_hint_seen_v1", "1"); } catch {}
            hideTimer = window.setTimeout(() => setShowHint(false), 4500);
          }, 1300);
        } else if (!visible && timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (timer !== null) window.clearTimeout(timer);
      if (hideTimer !== null) window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("generos").select("key,capa_url");
      const map: Record<string, string | null> = {};
      (data ?? []).forEach((r: any) => { map[String(r.key).toUpperCase()] = r.capa_url ?? null; });
      setCovers(map);
    })();
  }, []);

  const active = GENRES.find((g) => g.key === openKey) || null;
  const activeBeats = useMemo(
    () => (active ? beats.filter((b: any) => active.match(b.genre)) : []),
    [beats, active]
  );

  return (
    <>
      <div ref={gridRef} className="grid grid-cols-2 max-w-4xl mx-auto px-4 md:px-0 gap-[10px] md:gap-3">
        {GENRES.map((g, idx) => {
          const cover = covers[g.key];
          return (
            <button
              key={g.key}
              onClick={() => { setShowHint(false); setOpenKey(g.key); }}
              className={`group relative aspect-square w-full overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${idx === 0 && showHint ? "playlist-tutorial-pulse" : ""}`}
              style={{
                borderRadius: 12,
                background: cover
                  ? `url("${cover}") center/cover no-repeat`
                  : "#111",
              }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              <div
                className="absolute left-0 right-0 bottom-0 text-left"
                style={{ background: "rgba(0,0,0,0.85)", padding: "10px 12px" }}
              >
                <h3 className="font-bold text-white uppercase truncate" style={{ fontSize: 22, lineHeight: 1.1 }}>
                  {g.label}
                </h3>
              </div>

              {/* Spotify-style play button */}
              <span
                className={`gp-play-fab ${idx === 0 && showHint ? "gp-play-fab-bounce" : ""}`}
                aria-hidden="true"
              >
                <Play className="h-5 w-5 fill-black text-black ml-0.5" />
              </span>

              {/* First-card tap hint */}
              {idx === 0 && showHint && (
                <span className="gp-tap-hint" aria-hidden="true">
                  <Hand className="h-3.5 w-3.5" />
                  Toque para ouvir
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={!!openKey} onOpenChange={(v) => !v && setOpenKey(null)}>
        <DialogContent
          className="max-w-lg p-0 gap-0 border-white/10 overflow-hidden gp-modal"
          style={{ background: "#0d0d0d", borderRadius: 16 }}
        >
          {active && (
            <>
              {/* Cover top fullwidth */}
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                {covers[active.key] ? (
                  <img
                    src={covers[active.key] as string}
                    alt={`Capa ${active.label}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${active.color}55, #111)` }}
                  />
                )}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, rgba(13,13,13,0) 30%, rgba(13,13,13,0.95) 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <DialogTitle className="text-white font-black tracking-tight" style={{ fontSize: 28, lineHeight: 1 }}>
                    {active.label}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-xs mt-1.5">
                    {active.pack100} no Pack 100 · {active.pack300} no Pack 300
                  </DialogDescription>
                </div>
              </div>

              <div
                className="overflow-y-auto p-3 flex flex-col gap-1 gp-scroll"
                style={{ maxHeight: "55vh" }}
              >
                {activeBeats.length > 0 ? (
                  activeBeats.map((b, i) => (
                    <BeatRow
                      key={`${b.name}-${i}`}
                      beat={b}
                      index={i}
                      color={active.color}
                      delayMs={i * 50}
                    />
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
