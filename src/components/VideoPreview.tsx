import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";

function getEmbedUrl(url: string): { src: string; provider: "youtube" | "vimeo" } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt)
    return {
      src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`,
      provider: "youtube",
    };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm)
    return {
      src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&playsinline=1`,
      provider: "vimeo",
    };
  return null;
}


export function VideoPreview({ url, poster }: { url: string; poster?: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
    setPaused(true);
  }, [embed, directUrl, url]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.muted = false;
      v.volume = 1;
      void v.play();
      setStarted(true);
    } else {
      v.pause();
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {embed ? (
        <iframe
          ref={iframeRef}
          src={
            embed.provider === "youtube"
              ? `https://www.youtube.com/embed/${embed.src.match(/embed\/([\w-]{11})/)?.[1]}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1`
              : embed.src.replace(/[?&]autoplay=1/, "").replace(/[?&]muted=1/, "")
          }
          title="Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={directUrl}
            poster={poster}
            preload="metadata"
            playsInline
            onClick={togglePlay}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          />
          {!started && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              aria-label="Reproduzir vídeo"
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center animate-vsl-pulse"
                style={{
                  backgroundColor: "#39FF14",
                  boxShadow: "0 0 24px rgba(57,255,20,0.5)",
                }}
              >
                <Play className="h-6 w-6 fill-black text-black ml-[2px]" strokeWidth={0} />
              </div>
            </button>
          )}
          {started && !paused && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              aria-label="Pausar"
              className="absolute bottom-2 left-2 z-20 flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                backgroundColor: "rgba(0,0,0,0.5)",
                borderRadius: 6,
              }}
            >
              <Pause className="fill-white text-white" style={{ width: 12, height: 12 }} strokeWidth={0} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
