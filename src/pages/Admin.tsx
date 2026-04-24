import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Music2, Trash2, Plus, Video, Image as ImageIcon, Link2, Save, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BeatRow = { id?: string; name: string; url: string; key?: string | null; bpm?: string | null; position: number };
type ImageRow = { id?: string; url: string; position: number };

export default function Admin() {
  const [beats, setBeats] = useState<BeatRow[]>([]);
  const [video, setVideo] = useState<string>("");
  const [proofImages, setProofImages] = useState<ImageRow[]>([]);
  const [newImage, setNewImage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load from Supabase + migrate from localStorage on first run
  useEffect(() => {
    (async () => {
      const [{ data: settings }, { data: imgs }, { data: bts }] = await Promise.all([
        supabase.from("site_settings").select("key,value"),
        supabase.from("proof_images").select("*").order("position", { ascending: true }),
        supabase.from("beats").select("*").order("position", { ascending: true }),
      ]);

      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      let v = map["preview_video"] ?? "";
      let c = map["checkout_url"] ?? "";
      let imageRows = (imgs ?? []) as ImageRow[];
      let beatRows = (bts ?? []) as BeatRow[];

      // One-shot migration from localStorage
      const migrated = localStorage.getItem("nr_migrated_to_supabase");
      if (!migrated) {
        const lsVideo = localStorage.getItem("nr_preview_video") || "";
        const lsCheckout = localStorage.getItem("nr_checkout_url") || "";
        let lsImages: string[] = [];
        let lsBeats: any[] = [];
        try { lsImages = JSON.parse(localStorage.getItem("nr_proof_images") || "[]"); } catch {}
        try { lsBeats = JSON.parse(localStorage.getItem("nr_beats") || "[]"); } catch {}

        const ops: PromiseLike<any>[] = [];
        if (lsVideo && !v) {
          v = lsVideo;
          ops.push(Promise.resolve(supabase.from("site_settings").upsert({ key: "preview_video", value: lsVideo })));
        }
        if (lsCheckout && !c) {
          c = lsCheckout;
          ops.push(Promise.resolve(supabase.from("site_settings").upsert({ key: "checkout_url", value: lsCheckout })));
        }
        if (lsImages.length && imageRows.length === 0) {
          const rows = lsImages.map((url, i) => ({ url, position: i }));
          ops.push(supabase.from("proof_images").insert(rows).select().then(({ data }) => {
            if (data) imageRows = data as ImageRow[];
          }));
        }
        if (lsBeats.length && beatRows.length === 0) {
          const rows = lsBeats.map((b, i) => ({
            name: b.name || `Beat ${i + 1}`, url: b.url || "",
            key: b.key || null, bpm: b.bpm || null, position: i,
          }));
          ops.push(supabase.from("beats").insert(rows).select().then(({ data }) => {
            if (data) beatRows = data as BeatRow[];
          }));
        }
        if (ops.length) {
          await Promise.all(ops);
          toast.success("Dados do localStorage migrados para o banco!");
        }
        localStorage.setItem("nr_migrated_to_supabase", "1");
      }

      setVideo(v);
      setCheckoutUrl(c);
      setProofImages(imageRows);
      setBeats(beatRows);
      setLoading(false);
    })();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) { toast.error("Erro ao salvar"); return false; }
    return true;
  };

  const saveVideo = async () => {
    if (await saveSetting("preview_video", video)) toast.success("Vídeo salvo!");
  };
  const clearVideo = async () => {
    setVideo("");
    if (await saveSetting("preview_video", "")) toast.success("Vídeo removido");
  };
  const saveCheckout = async () => {
    if (await saveSetting("checkout_url", checkoutUrl)) toast.success("Link salvo!");
  };

  const addBeat = async () => {
    const position = beats.length;
    const { data, error } = await supabase.from("beats")
      .insert({ name: `Beat ${position + 1}`, url: "", position })
      .select().single();
    if (error || !data) { toast.error("Erro"); return; }
    setBeats([...beats, data as BeatRow]);
    toast.success("Beat adicionado");
  };
  const updateBeat = (i: number, patch: Partial<BeatRow>) => {
    setBeats(beats.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };
  const persistBeat = async (i: number) => {
    const b = beats[i];
    if (!b.id) return;
    const { error } = await supabase.from("beats")
      .update({ name: b.name, url: b.url, key: b.key, bpm: b.bpm }).eq("id", b.id);
    if (error) toast.error("Erro ao salvar"); else toast.success("Beat salvo");
  };
  const removeBeat = async (i: number) => {
    const b = beats[i];
    if (b.id) await supabase.from("beats").delete().eq("id", b.id);
    setBeats(beats.filter((_, idx) => idx !== i));
    toast.success("Beat removido");
  };

  const addImage = async () => {
    if (!newImage.trim()) { toast.error("Cole o link da imagem primeiro"); return; }
    const position = proofImages.length;
    const { data, error } = await supabase.from("proof_images")
      .insert({ url: newImage.trim(), position }).select().single();
    if (error || !data) { toast.error("Erro"); return; }
    setProofImages([...proofImages, data as ImageRow]);
    setNewImage("");
    toast.success("Imagem adicionada");
  };
  const removeImage = async (i: number) => {
    const img = proofImages[i];
    if (img.id) await supabase.from("proof_images").delete().eq("id", img.id);
    setProofImages(proofImages.filter((_, idx) => idx !== i));
    toast.success("Imagem removida");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

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
            Conteúdo agora é salvo no banco — todos os visitantes veem o mesmo. Cole <strong>links externos</strong> dos seus arquivos.
          </p>
        </div>

        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Vídeo de preview</h2>
          </div>
          <Label htmlFor="video" className="text-xs text-muted-foreground">YouTube, Vimeo ou .mp4 direto</Label>
          <div className="flex gap-2 mt-2">
            <Input id="video" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1" />
            <Button onClick={saveVideo} size="sm"><Save className="h-3 w-3 mr-1" /> Salvar</Button>
            {video && <Button onClick={clearVideo} variant="outline" size="sm"><Trash2 className="h-3 w-3" /></Button>}
          </div>
        </Card>

        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Link de pagamento</h2>
          </div>
          <Label htmlFor="checkout" className="text-xs text-muted-foreground">
            Hotmart, Kiwify, Eduzz, Stripe etc. Os CTAs da home redirecionam pra cá.
          </Label>
          <div className="flex gap-2 mt-2">
            <Input id="checkout" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} placeholder="https://pay.hotmart.com/..." className="flex-1" />
            <Button onClick={saveCheckout} size="sm"><Save className="h-3 w-3 mr-1" /> Salvar</Button>
          </div>
        </Card>

        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="font-bold tracking-wide uppercase text-sm">Fotos de prova social</h2>
          </div>
          <Label className="text-xs text-muted-foreground">Link de uma imagem (.jpg, .png, .webp)</Label>
          <div className="flex gap-2 mt-2">
            <Input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="https://i.imgur.com/exemplo.jpg" className="flex-1" onKeyDown={(e) => e.key === "Enter" && addImage()} />
            <Button onClick={addImage} size="sm"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
          </div>
          {proofImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {proofImages.map((img, i) => (
                <div key={img.id ?? i} className="relative group rounded-md overflow-hidden border border-border/60">
                  <img src={img.url} alt={`Prova ${i + 1}`} className="w-full h-40 object-cover bg-muted" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border-border/60 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h2 className="font-bold tracking-wide uppercase text-sm">Beats (links externos)</h2>
            </div>
            <Button onClick={addBeat} size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Adicionar beat</Button>
          </div>
          <p className="text-xs text-muted-foreground">Link direto do .mp3 ou .wav. Para waveform, o link precisa permitir CORS.</p>
          {beats.length === 0 && <p className="mt-6 text-sm text-muted-foreground text-center py-8">Nenhum beat ainda.</p>}
          {beats.length > 0 && (
            <div className="mt-5 space-y-3">
              {beats.map((b, i) => (
                <div key={b.id ?? i} className="p-3 rounded-md border border-border/60 bg-background space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">#{i + 1}</span>
                    <Input value={b.name} onChange={(e) => updateBeat(i, { name: e.target.value })} placeholder="Nome do beat" className="flex-1 h-8" />
                    <Input value={b.key ?? ""} onChange={(e) => updateBeat(i, { key: e.target.value })} placeholder="Nota" className="w-24 h-8" />
                    <Input value={b.bpm ?? ""} onChange={(e) => updateBeat(i, { bpm: e.target.value })} placeholder="BPM" className="w-20 h-8" />
                    <Button variant="ghost" size="sm" onClick={() => persistBeat(i)}><Save className="h-4 w-4 text-primary" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => removeBeat(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <Input value={b.url} onChange={(e) => updateBeat(i, { url: e.target.value })} onBlur={() => persistBeat(i)} placeholder="https://link-direto-do-audio.mp3" className="h-8 text-xs" />
                  {b.url && <audio src={b.url} controls className="w-full h-8" />}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
