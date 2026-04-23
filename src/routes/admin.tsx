import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Music2, Trash2, Plus, Video, Image as ImageIcon, Link2, Save, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Nova Realeza" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

type BeatMeta = { name: string; url: string; key?: string; bpm?: string };

function Admin() {
  const [beats, setBeats] = useState<BeatMeta[]>([]);
  const [video, setVideo] = useState<string>("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setBeats(JSON.parse(localStorage.getItem("nr_beats") || "[]"));
      setProofImages(JSON.parse(localStorage.getItem("nr_proof_images") || "[]"));
      setVideo(localStorage.getItem("nr_preview_video") || "");
      setCheckoutUrl(localStorage.getItem("nr_checkout_url") || "");
    } catch {}
    setLoaded(true);
  }, []);

  // Auto-save vídeo sempre que mudar (após carregamento inicial)
  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    if (video) localStorage.setItem("nr_preview_video", video);
    else localStorage.removeItem("nr_preview_video");
  }, [video, loaded]);

  // Auto-save link de pagamento
  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    if (checkoutUrl) localStorage.setItem("nr_checkout_url", checkoutUrl);
    else localStorage.removeItem("nr_checkout_url");
  }, [checkoutUrl, loaded]);

  const saveBeats = (next: BeatMeta[]) => {
    setBeats(next);
    localStorage.setItem("nr_beats", JSON.stringify(next));
  };
  const persistBeats = () => {
    localStorage.setItem("nr_beats", JSON.stringify(beats));
    toast.success("Beats salvos! Recarregue a home para ver.");
  };
  const saveImages = (next: string[]) => {
    setProofImages(next);
    localStorage.setItem("nr_proof_images", JSON.stringify(next));
  };
  const persistImages = () => {
    localStorage.setItem("nr_proof_images", JSON.stringify(proofImages));
    toast.success("Imagens salvas! Recarregue a home para ver.");
  };
  const saveVideo = (url: string) => {
    setVideo(url);
    if (url) {
      localStorage.setItem("nr_preview_video", url);
      toast.success("Vídeo salvo! Recarregue a home para ver.");
    } else {
      localStorage.removeItem("nr_preview_video");
      toast.success("Vídeo removido");
    }
  };

  const addBeat = () => {
    saveBeats([...beats, { name: `Beat ${beats.length + 1}`, url: "", key: "", bpm: "" }]);
    toast.success("Beat adicionado. Cole o link e os dados.");
  };
  const updateBeat = (i: number, patch: Partial<BeatMeta>) => {
    saveBeats(beats.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };
  const removeBeat = (i: number) => {
    saveBeats(beats.filter((_, idx) => idx !== i));
    toast.success("Beat removido");
  };

  const addImage = () => {
    if (!newImage.trim()) {
      toast.error("Cole o link da imagem primeiro");
      return;
    }
    saveImages([...proofImages, newImage.trim()]);
    setNewImage("");
    toast.success("Imagem adicionada");
  };
  const removeImage = (i: number) => {
    saveImages(proofImages.filter((_, idx) => idx !== i));
    toast.success("Imagem removida");
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
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Painel de conteúdo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cole <strong>links externos</strong> dos seus arquivos. Sem limite de tamanho. Use Dropbox,
            Google Drive (link público), YouTube, Vimeo, Imgur, ou qualquer hospedagem direta (.mp3, .mp4, .jpg).
          </p>
          <div className="mt-3 text-xs text-muted-foreground bg-card border border-border/60 rounded-md p-3">
            <strong className="text-foreground">Dica para Dropbox:</strong> troque <code>?dl=0</code> por <code>?raw=1</code> no final do link.
            <br />
            <strong className="text-foreground">Google Drive:</strong> use <code>https://drive.google.com/uc?export=download&amp;id=ID_DO_ARQUIVO</code>
          </div>
        </div>

        {/* Vídeo */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Vídeo de preview</h2>
          </div>
          <Label htmlFor="video" className="text-xs text-muted-foreground">
            Cole o link do YouTube, Vimeo ou um .mp4 direto
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="video"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://...mp4"
              className="flex-1"
            />
            <Button onClick={() => saveVideo(video)} variant="default" size="sm">
              <Save className="h-3 w-3 mr-1" /> Salvar
            </Button>
            {video && (
              <Button onClick={() => saveVideo("")} variant="outline" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {video && (
            <p className="mt-3 text-xs text-muted-foreground truncate">Atual: {video}</p>
          )}
        </Card>

        {/* Link de pagamento */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Link de pagamento</h2>
          </div>
          <Label htmlFor="checkout" className="text-xs text-muted-foreground">
            Cole o link da sua página de venda (Hotmart, Kiwify, Eduzz, Stripe, Pay etc.). Os botões de CTA da home vão redirecionar para cá.
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="checkout"
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              placeholder="https://pay.hotmart.com/..."
              className="flex-1"
            />
            {checkoutUrl && (
              <Button onClick={() => setCheckoutUrl("")} variant="outline" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {checkoutUrl && (
            <p className="mt-3 text-xs text-muted-foreground truncate">
              Salvo automaticamente · Atual: {checkoutUrl}
            </p>
          )}
        </Card>

        {/* Fotos */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Fotos de prova social</h2>
          </div>
          <Label className="text-xs text-muted-foreground">Cole o link de uma imagem (.jpg, .png, .webp)</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="https://i.imgur.com/exemplo.jpg"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <Button onClick={addImage} size="sm">
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>
          {proofImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {proofImages.map((src, i) => (
                <div key={i} className="relative group rounded-md overflow-hidden border border-border/60">
                  <img src={src} alt={`Prova ${i + 1}`} className="w-full h-40 object-cover bg-muted" />
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
          {proofImages.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={persistImages} size="sm" variant="default">
                <Save className="h-3 w-3 mr-1" /> Salvar imagens
              </Button>
            </div>
          )}
        </Card>

        {/* Beats */}
        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h2 className="font-bold tracking-wide uppercase text-sm">Beats (links externos)</h2>
            </div>
            <Button onClick={addBeat} size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" /> Adicionar beat
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole o link direto do .mp3 ou .wav. Para waveform funcionar, o link precisa permitir CORS
            (Dropbox <code>?raw=1</code> e Cloudinary funcionam bem).
          </p>
          {beats.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground text-center py-8">
              Nenhum beat ainda. Clique em "Adicionar beat" para começar.
            </p>
          )}
          {beats.length > 0 && (
            <div className="mt-5 space-y-3">
              {beats.map((b, i) => (
                <div key={i} className="p-3 rounded-md border border-border/60 bg-background space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                    <Input
                      value={b.name}
                      onChange={(e) => updateBeat(i, { name: e.target.value })}
                      placeholder="Nome do beat"
                      className="flex-1 h-8"
                    />
                    <Input
                      value={b.key ?? ""}
                      onChange={(e) => updateBeat(i, { key: e.target.value })}
                      placeholder="Nota"
                      className="w-24 h-8"
                    />
                    <Input
                      value={b.bpm ?? ""}
                      onChange={(e) => updateBeat(i, { bpm: e.target.value })}
                      placeholder="BPM"
                      className="w-20 h-8"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeBeat(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={b.url}
                    onChange={(e) => updateBeat(i, { url: e.target.value })}
                    placeholder="https://link-direto-do-audio.mp3"
                    className="h-8 text-xs"
                  />
                  {b.url && <audio src={b.url} controls className="w-full h-8" />}
                </div>
              ))}
            </div>
          )}
          {beats.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={persistBeats} size="sm" variant="default">
                <Save className="h-3 w-3 mr-1" /> Salvar beats
              </Button>
            </div>
          )}
        </Card>

        <div className="text-xs text-muted-foreground border-t border-border/50 pt-6">
          Para venda real com download seguro, pagamento e hospedagem, ative o Lovable Cloud — peça no chat.
        </div>
      </main>
    </div>
  );
}