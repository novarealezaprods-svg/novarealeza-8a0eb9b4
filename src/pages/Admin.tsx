import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Trash2, Plus, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Upload } from "lucide-react";

// Senha pra acessar o painel — troque aqui pra algo só seu
const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "admin_unlocked_v1";

type Beat = { id: string; name: string; url: string; key: string | null; bpm: string | null; position: number };
type Image = { id: string; url: string; position: number };

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");

  // Settings
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");

  // Beats
  const [beats, setBeats] = useState<Beat[]>([]);
  const [newBeat, setNewBeat] = useState({ name: "", url: "", key: "", bpm: "" });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);

  // Images
  const [images, setImages] = useState<Image[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) loadAll();
  }, [unlocked]);

  const loadAll = async () => {
    const [{ data: settings }, { data: bts }, { data: imgs }] = await Promise.all([
      supabase.from("site_settings").select("key,value"),
      supabase.from("beats").select("*").order("position", { ascending: true }),
      supabase.from("proof_images").select("*").order("position", { ascending: true }),
    ]);
    const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
    setCheckoutUrl(map["checkout_url"] ?? "");
    setPreviewVideo(map["preview_video"] ?? "");
    setBeats((bts ?? []) as Beat[]);
    setImages((imgs ?? []) as Image[]);
  };

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      toast.success("Acesso liberado");
    } else {
      toast.error("Senha incorreta");
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUnlocked(false);
    setPw("");
  };

  // Settings
  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Salvo!");
  };

  // Beats
  const addBeat = async () => {
    if (!newBeat.name || !newBeat.url) return toast.error("Nome e URL obrigatórios");
    const maxPos = beats.length ? Math.max(...beats.map((b) => b.position)) : -1;
    const { error } = await supabase.from("beats").insert({
      name: newBeat.name,
      url: newBeat.url,
      key: newBeat.key || null,
      bpm: newBeat.bpm || null,
      position: maxPos + 1,
    });
    if (error) return toast.error(error.message);
    setNewBeat({ name: "", url: "", key: "", bpm: "" });
    toast.success("Beat adicionado");
    loadAll();
  };

  const updateBeat = async (id: string, patch: Partial<Beat>) => {
    const { error } = await supabase.from("beats").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    loadAll();
  };

  const deleteBeat = async (id: string) => {
    if (!confirm("Apagar este beat?")) return;
    const { error } = await supabase.from("beats").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    loadAll();
  };

  const moveBeat = async (id: string, dir: -1 | 1) => {
    const idx = beats.findIndex((b) => b.id === id);
    const swap = beats[idx + dir];
    if (!swap) return;
    const a = beats[idx];
    await supabase.from("beats").update({ position: swap.position }).eq("id", a.id);
    await supabase.from("beats").update({ position: a.position }).eq("id", swap.id);
    loadAll();
  };

  // Upload áudio direto para o storage e retorna URL pública
  const uploadAudio = async (file: File): Promise<string | null> => {
    const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
    const mimeByExt: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      flac: "audio/flac",
    };
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("beats").upload(path, file, {
      contentType: file.type || mimeByExt[ext] || "audio/mpeg",
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("beats").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUploadForBeat = async (id: string, file: File) => {
    setUploadingId(id);
    const url = await uploadAudio(file);
    setUploadingId(null);
    if (!url) return;
    await updateBeat(id, { url });
  };

  const handleUploadForNew = async (file: File) => {
    setUploadingNew(true);
    const url = await uploadAudio(file);
    setUploadingNew(false);
    if (!url) return;
    setNewBeat((b) => ({ ...b, url }));
    toast.success("Áudio enviado — clique em Adicionar");
  };

  // Images
  const addImage = async () => {
    if (!newImageUrl) return;
    const maxPos = images.length ? Math.max(...images.map((i) => i.position)) : -1;
    const { error } = await supabase.from("proof_images").insert({ url: newImageUrl, position: maxPos + 1 });
    if (error) return toast.error(error.message);
    setNewImageUrl("");
    toast.success("Imagem adicionada");
    loadAll();
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Apagar imagem?")) return;
    const { error } = await supabase.from("proof_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };

  const moveImage = async (id: string, dir: -1 | 1) => {
    const idx = images.findIndex((i) => i.id === id);
    const swap = images[idx + dir];
    if (!swap) return;
    const a = images[idx];
    await supabase.from("proof_images").update({ position: swap.position }).eq("id", a.id);
    await supabase.from("proof_images").update({ position: a.position }).eq("id", swap.id);
    loadAll();
  };

  // Senha
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-sm p-8">
          <h1 className="text-xl font-bold mb-4 text-center">Painel Admin</h1>
          <form onSubmit={tryUnlock} className="space-y-4">
            <div>
              <Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:underline">← Voltar ao site</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Painel Admin</h1>
          <div className="flex gap-2">
            <Link to="/"><Button variant="outline">Ver site</Button></Link>
            <Button variant="outline" onClick={lock}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
          </div>
        </header>

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="beats">Beats ({beats.length})</TabsTrigger>
            <TabsTrigger value="images">Imagens ({images.length})</TabsTrigger>
          </TabsList>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="checkout">Link do Checkout (Mercado Pago)</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="checkout" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} placeholder="https://mpago.la/..." />
                  <Button onClick={() => saveSetting("checkout_url", checkoutUrl)}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label htmlFor="video">URL do vídeo de preview</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="video" value={previewVideo} onChange={(e) => setPreviewVideo(e.target.value)} placeholder="https://..." />
                  <Button onClick={() => saveSetting("preview_video", previewVideo)}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* BEATS */}
          <TabsContent value="beats" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Adicionar beat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Nome" value={newBeat.name} onChange={(e) => setNewBeat({ ...newBeat, name: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="URL do áudio (ou faça upload)" value={newBeat.url} onChange={(e) => setNewBeat({ ...newBeat, url: e.target.value })} />
                  <label className="cursor-pointer">
                    <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadForNew(e.target.files[0])} />
                    <Button type="button" variant="outline" size="icon" asChild disabled={uploadingNew}>
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                </div>
                <Input placeholder="Key (ex: Cm)" value={newBeat.key} onChange={(e) => setNewBeat({ ...newBeat, key: e.target.value })} />
                <Input placeholder="BPM (ex: 140)" value={newBeat.bpm} onChange={(e) => setNewBeat({ ...newBeat, bpm: e.target.value })} />
              </div>
              <Button className="mt-4" onClick={addBeat} disabled={uploadingNew}>
                <Plus className="w-4 h-4 mr-2" />{uploadingNew ? "Enviando áudio..." : "Adicionar"}
              </Button>
            </Card>

            <div className="space-y-2">
              {beats.map((b, i) => (
                <Card key={b.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <Input className="md:col-span-3" value={b.name} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, name: e.target.value } : x))} />
                    <Input className="md:col-span-4" value={b.url} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, url: e.target.value } : x))} />
                    <Input className="md:col-span-1" placeholder="Key" value={b.key ?? ""} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))} />
                    <Input className="md:col-span-1" placeholder="BPM" value={b.bpm ?? ""} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, bpm: e.target.value } : x))} />
                    <div className="md:col-span-3 flex gap-1 justify-end">
                      <label className="cursor-pointer">
                        <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadForBeat(b.id, e.target.files[0])} />
                        <Button size="icon" variant="outline" asChild disabled={uploadingId === b.id} title="Substituir áudio (upload)">
                          <span><Upload className="w-4 h-4" /></span>
                        </Button>
                      </label>
                      <Button size="icon" variant="ghost" onClick={() => moveBeat(b.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveBeat(b.id, 1)} disabled={i === beats.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => updateBeat(b.id, { name: b.name, url: b.url, key: b.key, bpm: b.bpm })}><Save className="w-4 h-4" /></Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteBeat(b.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
              {beats.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum beat ainda.</p>}
            </div>
          </TabsContent>

          {/* IMAGES */}
          <TabsContent value="images" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Adicionar imagem (URL)</h3>
              <div className="flex gap-2">
                <Input placeholder="https://..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
                <Button onClick={addImage}><Plus className="w-4 h-4 mr-2" />Adicionar</Button>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {images.map((img, i) => (
                <Card key={img.id} className="p-3 space-y-2">
                  <img src={img.url} alt="Prova" className="w-full h-40 object-cover rounded" />
                  <div className="flex gap-1 justify-between">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => moveImage(img.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveImage(img.id, 1)} disabled={i === images.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    </div>
                    <Button size="icon" variant="destructive" onClick={() => deleteImage(img.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </Card>
              ))}
              {images.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhuma imagem ainda.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}