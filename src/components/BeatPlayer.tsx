import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";

export type BeatItem = {
  name: string;
  url: string;
  key?: string;
  bpm?: number | string;
  image_url?: string | null;
  // Caminho de um MP4 local (ex.: /visualizers/type-trap.mp4) — nunca um link
  // do YouTube. Baixe e converta o vídeo antes (ver public/visualizers/),
  // não existe player de terceiros embutido no site. Toca em loop e mudo
  // como fundo do card enquanto o beat está tocando; fora disso mostra
  // image_url.
  visualizer_video?: string | null;
};

// Cobre um card quadrado (aspect-square) com o vídeo do visualizer, recortado
// e centralizado via object-fit — sem depender de nenhum player externo.
function VisualizerBackground({ src, playing }: { src: string; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // O React nem sempre reflete a prop `muted` no elemento de verdade, e sem
    // o mute aplicado o iOS bloqueia o autoplay inline.
    el.muted = true;
    el.defaultMuted = true;
  }, [src]);

  // Acompanha o play/pause do áudio. O elemento é montado assim que o card
  // fica ativo (antes do áudio começar), então o download já started e o vídeo
  // aparece sem espera perceptível.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => {
        /* autoplay bloqueado (ex.: modo de baixo consumo do iOS) — segue com
           a imagem de fundo, sem quebrar o player de áudio */
      });
    } else {
      el.pause();
    }
  }, [playing]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      src={src}
      autoPlay
      muted
      loop
      playsInline
      // iOS antigo ainda olha para o atributo com prefixo
      {...{ "webkit-playsinline": "true" }}
      preload="auto"
      disablePictureInPicture
    />
  );
}

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

// A VSL do hero é um <video> independente deste player. Quando um beat
// começa a tocar, ela precisa pausar imediatamente pra não sobrepor áudio.
// O VideoPreview se registra aqui ao montar.
let vslPause: (() => void) | null = null;
export function registerVslPause(fn: (() => void) | null) {
  vslPause = fn;
}

export { playUrl, pauseCurrent };

export function useBeatSnap() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (audio) return audio;

  const el = new Audio();
  el.preload = "none";

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
  vslPause?.();
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
  onOpen,
}: {
  beat: BeatItem;
  index?: number;
  displayName?: string;
  genre?: string;
  onOpen?: (index: number) => void;
}) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

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
  // Monta assim que o beat vira o ativo (isActive é setado de forma síncrona no
  // clique), não só quando o áudio começa — evita a espera de download.
  const visualizerSrc = isActive ? beat.visualizer_video || null : null;

  return (
    <div
      className="beat-card-anim group relative flex flex-col justify-between text-left transition-all duration-200 hover:-translate-y-1 p-3 md:p-5 aspect-square"
      style={{
        background: "#111111",
        border: `1px solid ${isPlaying ? "#39FF14" : "#222222"}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: isPlaying
          ? "0 0 0 1px #39FF14, 0 0 24px rgba(57,255,20,0.25), 0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.4)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Capa do beat como <img> de verdade (não background-image do CSS),
          senão loading="lazy" não tem efeito nenhum — o navegador baixa
          background-image sempre, não importa se está fora da tela. */}
      {bgImage && !visualizerSrc && (
        <>
          <img
            src={bgImage}
            alt={`Capa do beat ${name}${genre ? ` — ${genre}` : ""}`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)" }}
          />
        </>
      )}

      {visualizerSrc && (
        <>
          <VisualizerBackground src={visualizerSrc} playing={isPlaying} />
          {/* Escurece o vídeo para o texto e o botão continuarem legíveis por cima */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.7) 100%)" }}
          />
        </>
      )}

      <div
        className="relative z-[1] text-center text-white truncate text-[12px] md:text-base self-center"
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

      <div className="relative z-[1] flex justify-center my-1 md:my-4">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          disabled={!resolvedUrl}
          className={`h-11 w-11 md:h-16 md:w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition disabled:opacity-60 ${
            isPlaying ? "beat-pulse" : ""
          }`}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 md:h-7 md:w-7 fill-current" />
          ) : isLoading ? (
            <Loader2 className="h-5 w-5 md:h-7 md:w-7 animate-spin" />
          ) : (
            <Play className="h-5 w-5 md:h-7 md:w-7 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {hasError && (
        <div className="mt-2 text-[10px] text-destructive leading-tight text-center">
          Áudio indisponível — reenvie pelo /admin
        </div>
      )}
    </div>
  );
}
