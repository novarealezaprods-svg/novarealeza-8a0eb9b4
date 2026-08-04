import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight, Play as PlayIcon, Pause as PauseIcon, Loader2 } from "lucide-react";
import { type BeatItem, playUrl, pauseCurrent, useBeatSnap } from "@/components/BeatPlayer";
import { normalizeDirectUrl } from "@/lib/normalize-url";

export default function BeatCarouselDialog({
  beats,
  openIndex,
  onClose,
  meta,
}: {
  beats: BeatItem[];
  openIndex: number | null;
  onClose: () => void;
  meta: { name: string; genre: string }[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: openIndex ?? 0 });
  const [selected, setSelected] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex !== null && emblaApi) {
      emblaApi.scrollTo(openIndex, true);
      setSelected(openIndex);
    }
  }, [openIndex, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      pauseCurrent();
    };
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const open = openIndex !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="beat-dialog-overlay fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <DialogPrimitive.Content className="beat-dialog-content pointer-events-auto relative w-full max-w-md">
            <DialogTitle className="sr-only">Beats</DialogTitle>
            <div className="overflow-hidden rounded-lg" ref={emblaRef}>
              <div className="flex">
                {beats.map((b, i) => {
                  const m = meta[i] || { name: b.name, genre: "TRAP" };
                  return (
                    <div key={`${b.name}-${i}`} className="flex-[0_0_100%] min-w-0 px-1">
                      <BeatSlide beat={b} name={b.name || m.name} active={selected === i} />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Anterior"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Próximo"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <DialogPrimitive.Close className="absolute right-2 top-2 rounded-full opacity-90 hover:opacity-100 transition bg-black/60 p-1.5 z-10">
              <X className="h-4 w-4 text-white" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>

            <div className="mt-3 flex justify-center gap-1.5">
              {beats.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Ir ao beat ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${selected === i ? "w-5 bg-primary" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

function BeatSlide({ beat, name, active }: { beat: BeatItem; name: string; active: boolean }) {
  const [resolvedUrl, setResolvedUrl] = useState("");
  const snap = useBeatSnap();
  useEffect(() => { setResolvedUrl(normalizeDirectUrl(beat.url)); }, [beat.url]);

  useEffect(() => {
    if (!active) return;
  }, [active]);

  const isActive = snap.activeUrl === resolvedUrl;
  const isPlaying = isActive && snap.isPlaying;
  const isLoading = snap.loadingUrl === resolvedUrl && !snap.isPlaying;
  const bgImage = beat.image_url || null;

  const toggle = () => {
    if (!resolvedUrl) return;
    if (isPlaying) { pauseCurrent(); return; }
    playUrl(resolvedUrl);
  };

  return (
    <div
      className="relative w-full aspect-square flex flex-col justify-between p-5 rounded-lg overflow-hidden border border-border"
      style={{
        background: bgImage
          ? `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%), url("${bgImage}") center/cover no-repeat`
          : "#111111",
      }}
    >
      <div
        className="text-center text-white self-center text-sm md:text-lg"
        style={{
          fontWeight: 700,
          textTransform: "uppercase",
          background: "rgba(0,0,0,0.5)",
          padding: "6px 12px",
          borderRadius: 6,
        }}
      >
        {name}
      </div>

      <div className="flex justify-center">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          disabled={!resolvedUrl}
          className={`h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition disabled:opacity-60 ${isPlaying ? "beat-pulse" : ""}`}
        >
          {isPlaying ? (
            <PauseIcon className="h-9 w-9 fill-current" />
          ) : isLoading ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : (
            <PlayIcon className="h-9 w-9 fill-current ml-1" />
          )}
        </button>
      </div>

    </div>
  );
}
