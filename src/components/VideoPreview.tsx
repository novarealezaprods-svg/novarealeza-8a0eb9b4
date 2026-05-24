import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
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


export function VideoPreview({ url }: { url: string }) {
  const embed = getEmbedUrl(url);
  const directUrl = embed ? url : normalizeDirectUrl(url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setStarted(false);
  }, [embed, directUrl, url]);

  const handlePlay = () => {
    setStarted(true);
    if (embed?.provider === "youtube") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
      return;
    }
    if (embed?.provider === "vimeo") {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "play" }),
        "*"
      );
      return;
    }
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      v.volume = 1;
      void v.play();
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
        <video
          ref={videoRef}
          src={directUrl}
          preload="metadata"
          playsInline
          controls={started}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {!started && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Reproduzir vídeo"
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
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
    </div>
  );
}
