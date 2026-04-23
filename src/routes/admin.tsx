import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Music2, Trash2, Upload, Video, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Nova Realeza" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type Beat = { name: string; url: string };
type BeatMeta = { name: string; url: string; key?: string; bpm?: string };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Admin() {
  const [beats, setBeats] = useState<BeatMeta[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setBeats(JSON.parse(localStorage.getItem("nr_beats") || "[]"));
      setProofImages(JSON.parse(localStorage.getItem("nr_proof_images") || "[]"));
      setVideo(localStorage.getItem("nr_preview_video"));
    } catch {}
  }, []);

  const handleBeats = async (files: FileList | null) => {
    if (!files) return;
    const next = [...beats];
    for (const f of Array.from(files)) {
      const url = await fileToDataUrl(f);
      next.push({ name: f.name.replace(/\.[^.]+$/, ""), url, key: "", bpm: "" });
    }
    setBeats(next);
    try {
      localStorage.setItem("nr_beats", JSON.stringify(next));
    } catch {
      alert("Arquivos muito grandes para o armazenamento local. Para uploads grandes, ative o Lovable Cloud.");
    }
  };

  const updateBeat = (i: number, patch: Partial<BeatMeta>) => {
    const next = beats.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    setBeats(next);
    try {
      localStorage.setItem("nr_beats", JSON.stringify(next));
    } catch {}
  };

  const handleVideo = async (file: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setVideo(url);
    try {
      localStorage.setItem("nr_preview_video", url);
    } catch {
      alert("Vídeo muito grande para o armazenamento local. Use um arquivo menor ou ative o Lovable Cloud.");
    }
  };

  const handleImages = async (files: FileList | null) => {
    if (!files) return;
    const next = [...proofImages];
    for (const f of Array.from(files)) {
      next.push(await fileToDataUrl(f));
    }
    setProofImages(next);
    try {
      localStorage.setItem("nr_proof_images", JSON.stringify(next));
    } catch {
      alert("Imagens muito grandes para armazenamento local.");
    }
  };

  const removeBeat = (i: number) => {
    const next = beats.filter((_, idx) => idx !== i);
    setBeats(next);
    localStorage.setItem("nr_beats", JSON.stringify(next));
  };

  const removeImage = (i: number) => {
    const next = proofImages.filter((_, idx) => idx !== i);
    setProofImages(next);
    localStorage.setItem("nr_proof_images", JSON.stringify(next));
  };

  const clearVideo = () => {
    setVideo(null);
    localStorage.removeItem("nr_preview_video");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Music2 className="h-4 w-4 text-primary" /> Nova Realeza · Admin
          </div>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Painel de uploads</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Envie seus beats, o vídeo de preview e as fotos de prova social. Os arquivos ficam salvos no
            seu navegador (localStorage). Para hospedagem real e download público, ative o Lovable Cloud.
          </p>
        </div>

        {/* Vídeo */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Vídeo de preview</h2>
          </div>
          <Label htmlFor="video" className="text-xs text-muted-foreground">Selecione um arquivo .mp4 (curto, &lt;5MB recomendado)</Label>
          <Input
            id="video"
            type="file"
            accept="video/*"
            onChange={(e) => handleVideo(e.target.files?.[0] ?? null)}
            className="mt-2"
          />
          {video && (
            <div className="mt-4 space-y-3">
              <video src={video} controls className="w-full rounded-md max-h-72 bg-black" />
              <Button variant="outline" size="sm" onClick={clearVideo}>
                <Trash2 className="h-3 w-3 mr-1" /> Remover vídeo
              </Button>
            </div>
          )}
        </Card>

        {/* Fotos de prova social */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Fotos de prova social</h2>
          </div>
          <Label htmlFor="images" className="text-xs text-muted-foreground">Prints de vendas, depoimentos, conversas, streams etc.</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImages(e.target.files)}
            className="mt-2"
          />
          {proofImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {proofImages.map((src, i) => (
                <div key={i} className="relative group rounded-md overflow-hidden border border-border/60">
                  <img src={src} alt={`Prova ${i + 1}`} className="w-full h-40 object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Beats */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Seus beats</h2>
          </div>
          <Label htmlFor="beats" className="text-xs text-muted-foreground">Envie .mp3 / .wav (selecione vários)</Label>
          <Input
            id="beats"
            type="file"
            accept="audio/*"
            multiple
            onChange={(e) => handleBeats(e.target.files)}
            className="mt-2"
          />
          {beats.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="text-xs text-muted-foreground">{beats.length} beat(s) carregado(s)</div>
              {beats.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md border border-border/60 bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <audio src={b.url} controls className="mt-2 w-full h-8" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeBeat(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="text-xs text-muted-foreground border-t border-border/50 pt-6">
          Dica: para venda real com download seguro, pagamento e hospedagem dos beats, ative o
          Lovable Cloud — peça no chat "ativar Lovable Cloud" para configurar storage e checkout.
        </div>
      </main>
    </div>
  );
}