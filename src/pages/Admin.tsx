import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Trash2, Plus, ArrowUp, ArrowDown, Save, Eye, EyeOff, CheckSquare, Square } from "lucide-react";
import { Upload } from "lucide-react";

// Senha pra acessar o painel — troque aqui pra algo só seu
const ADMIN_PASSWORD = "admin123";
const STORAGE_KEY = "admin_unlocked_v1";

type Beat = { id: string; name: string; url: string; key: string | null; bpm: string | null; position: number; image_url: string | null; genre: string | null; active: boolean; no_pack_100: boolean; no_pack_300: boolean };
type Image = { id: string; url: string; position: number };
type Genero = { key: string; capa_url: string | null };

const GENRES = ["TRAP", "FUNK", "DRILL", "BOOMBAP"] as const;
type GenreFilter = "ALL" | (typeof GENRES)[number];

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");

  // Settings
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkoutUrlSupreme, setCheckoutUrlSupreme] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Beats
  const [beats, setBeats] = useState<Beat[]>([]);
  const [newBeat, setNewBeat] = useState({ name: "", url: "", key: "", bpm: "", genre: "" });
  const [genreFilter, setGenreFilter] = useState<GenreFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenre, setBulkGenre] = useState<string>("");
  const [bulkPack100, setBulkPack100] = useState<"keep" | "yes" | "no">("keep");
  const [bulkPack300, setBulkPack300] = useState<"keep" | "yes" | "no">("keep");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  // Images
  const [images, setImages] = useState<Image[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Genre covers
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [uploadingGeneroKey, setUploadingGeneroKey] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (unlocked) loadAll();
  }, [unlocked]);

  const loadAll = async () => {
    const [{ data: settings }, { data: bts }, { data: imgs }, { data: gns }] = await Promise.all([
      supabase.from("site_settings").select("key,value"),
      supabase.from("beats").select("*").order("position", { ascending: true }),
      supabase.from("proof_images").select("*").order("position", { ascending: true }),
      supabase.from("generos").select("key,capa_url"),
    ]);
    const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
    setCheckoutUrl(map["checkout_url"] ?? "");
    setCheckoutUrlSupreme(map["checkout_url_supreme"] ?? "");
    setPreviewVideo(map["preview_video"] ?? "");
    setBeats((bts ?? []) as Beat[]);
    setImages((imgs ?? []) as Image[]);
    // Garante 4 entradas mesmo se algum gênero estiver faltando
    const gnMap = Object.fromEntries(((gns ?? []) as Genero[]).map((g) => [g.key, g.capa_url]));
    setGeneros(GENRES.map((k) => ({ key: k, capa_url: gnMap[k] ?? null })));
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
      genre: newBeat.genre || null,
      position: maxPos + 1,
    });
    if (error) return toast.error(error.message);
    setNewBeat({ name: "", url: "", key: "", bpm: "", genre: "" });
    toast.success("Beat adicionado");
    loadAll();
  };

  const updateBeat = async (id: string, patch: Partial<Beat>) => {
    const { error } = await supabase.from("beats").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    loadAll();
  };

  // Bulk edit
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = (visible: Beat[]) => {
    setSelectedIds((prev) => {
      const allSelected = visible.every((b) => prev.has(b.id));
      if (allSelected) {
        const next = new Set(prev);
        visible.forEach((b) => next.delete(b.id));
        return next;
      }
      const next = new Set(prev);
      visible.forEach((b) => next.add(b.id));
      return next;
    });
  };
  const applyBulk = async () => {
    if (selectedIds.size === 0) return toast.error("Selecione ao menos 1 beat");
    const patch: Partial<Beat> = {};
    if (bulkGenre) patch.genre = bulkGenre;
    if (bulkPack100 !== "keep") patch.no_pack_100 = bulkPack100 === "yes";
    if (bulkPack300 !== "keep") patch.no_pack_300 = bulkPack300 === "yes";
    if (Object.keys(patch).length === 0) return toast.error("Defina pelo menos um campo");
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("beats").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} beat(s) atualizados`);
    setSelectedIds(new Set());
    setBulkGenre("");
    setBulkPack100("keep");
    setBulkPack300("keep");
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

  // Upload imagem do artista para o storage
  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `beat-covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("beat-images").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("beat-images").getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload de capa de playlist por gênero
  const handleUploadGeneroCover = async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo maior que 5MB");
      return;
    }
    if (!/(jpg|jpeg|png|webp)$/i.test(file.name)) {
      toast.error("Use JPG, PNG ou WEBP");
      return;
    }
    setUploadingGeneroKey(key);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `playlist-covers/${key.toLowerCase()}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("beat-images").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      setUploadingGeneroKey(null);
      return toast.error(upErr.message);
    }
    const { data } = supabase.storage.from("beat-images").getPublicUrl(path);
    const url = data.publicUrl;
    const { error: dbErr } = await supabase
      .from("generos")
      .upsert({ key, capa_url: url }, { onConflict: "key" });
    setUploadingGeneroKey(null);
    if (dbErr) return toast.error(dbErr.message);
    setGeneros((prev) => prev.map((g) => (g.key === key ? { ...g, capa_url: url } : g)));
    toast.success(`Capa de ${key} atualizada`);
  };

  const removeGeneroCover = async (key: string) => {
    const { error } = await supabase
      .from("generos")
      .upsert({ key, capa_url: null }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    setGeneros((prev) => prev.map((g) => (g.key === key ? { ...g, capa_url: null } : g)));
    toast.success("Capa removida");
  };

  const handleUploadImageForBeat = async (id: string, file: File) => {
    setUploadingImageId(id);
    const url = await uploadImage(file);
    setUploadingImageId(null);
    if (!url) return;
    await updateBeat(id, { image_url: url });
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

        <Card className="p-4 mb-6 border-primary/40 bg-primary/5">
          <h2 className="font-semibold mb-2">Está vendo "Unauthorized" na preview da Lovable?</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Esse aviso vem da própria Lovable, não do seu site. A URL <code>id-preview--*.lovable.app</code> só
            abre pra quem está logado no projeto. Pra liberar pra outras pessoas, use uma das opções abaixo:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-1">
            <li>
              <strong>Share preview</strong> (link temporário, 7 dias): no editor da Lovable, clique em{" "}
              <em>Share → Share preview</em> e copie o link gerado.
            </li>
            <li>
              <strong>URL publicada</strong> (definitiva, sem login):{" "}
              <a
                href="https://novarealeza.lovable.app"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                novarealeza.lovable.app
              </a>
              . Sempre que fizer mudanças no front, clique em <em>Publish → Update</em> pra atualizar.
            </li>
          </ul>
        </Card>

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="covers">Capas</TabsTrigger>
            <TabsTrigger value="beats">Beats ({beats.length})</TabsTrigger>
            <TabsTrigger value="images">Imagens ({images.length})</TabsTrigger>
          </TabsList>

          {/* SETTINGS */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="checkout">Link do Checkout — Pack Básico (R$ 19,90)</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="checkout" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} placeholder="https://mpago.la/..." />
                  <Button onClick={() => saveSetting("checkout_url", checkoutUrl)}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label htmlFor="checkout-supreme">Link do Checkout — Pack Suprema (R$ 47,90)</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="checkout-supreme" value={checkoutUrlSupreme} onChange={(e) => setCheckoutUrlSupreme(e.target.value)} placeholder="https://mpago.la/..." />
                  <Button onClick={() => saveSetting("checkout_url_supreme", checkoutUrlSupreme)}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label htmlFor="video">URL do vídeo de preview</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="video" value={previewVideo} onChange={(e) => setPreviewVideo(e.target.value)} placeholder="https://..." />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingVideo(true);
                        const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
                        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                        const { error } = await supabase.storage.from("videos").upload(path, file, {
                          contentType: file.type || "video/mp4",
                          upsert: false,
                        });
                        setUploadingVideo(false);
                        if (error) return toast.error(error.message);
                        const { data } = supabase.storage.from("videos").getPublicUrl(path);
                        setPreviewVideo(data.publicUrl);
                        await saveSetting("preview_video", data.publicUrl);
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" asChild disabled={uploadingVideo} title="Enviar MP4">
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                  <Button onClick={() => saveSetting("preview_video", previewVideo)}><Save className="w-4 h-4" /></Button>
                </div>
                {uploadingVideo && <p className="text-xs text-muted-foreground mt-1">Enviando vídeo...</p>}
              </div>
            </Card>
          </TabsContent>

          {/* GENRE COVERS */}
          <TabsContent value="covers" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-1">Capas das Playlists</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Foto que aparece como fundo de cada card de gênero na home. Use 1000x1000 (JPG/PNG/WEBP, até 5MB).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generos.map((g) => (
                  <div key={g.key} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/40">
                    <div className="flex-shrink-0">
                      {g.capa_url ? (
                        <img
                          src={g.capa_url}
                          alt={`Capa ${g.key}`}
                          className="rounded-lg object-cover border border-border"
                          style={{ width: 200, height: 200 }}
                        />
                      ) : (
                        <div
                          className="rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border"
                          style={{ width: 200, height: 200 }}
                        >
                          sem capa
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{g.key}</div>
                      <div className="mt-3 flex flex-col gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleUploadGeneroCover(g.key, e.target.files[0])}
                          />
                          <Button type="button" variant="outline" size="sm" asChild disabled={uploadingGeneroKey === g.key}>
                            <span>
                              <Upload className="w-3 h-3 mr-1" />
                              {uploadingGeneroKey === g.key ? "Enviando..." : g.capa_url ? "Trocar foto" : "Enviar foto"}
                            </span>
                          </Button>
                        </label>
                        {g.capa_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeGeneroCover(g.key)}>
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newBeat.genre}
                  onChange={(e) => setNewBeat({ ...newBeat, genre: e.target.value })}
                >
                  <option value="">Gênero (selecione)</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <Button className="mt-4" onClick={addBeat} disabled={uploadingNew}>
                <Plus className="w-4 h-4 mr-2" />{uploadingNew ? "Enviando áudio..." : "Adicionar"}
              </Button>
            </Card>

            {/* Filtro por gênero */}
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold mr-1">Filtrar:</span>
                {(["ALL", ...GENRES] as GenreFilter[]).map((g) => (
                  <Button
                    key={g}
                    size="sm"
                    variant={genreFilter === g ? "default" : "outline"}
                    onClick={() => setGenreFilter(g)}
                  >
                    {g === "ALL" ? "Todos" : g}
                  </Button>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">
                  {(() => {
                    const visible = genreFilter === "ALL" ? beats : beats.filter((b) => (b.genre || "").toUpperCase() === genreFilter);
                    return `${visible.length} beat(s)`;
                  })()}
                </span>
              </div>
            </Card>

            {/* Edição em massa */}
            {(() => {
              const visible = genreFilter === "ALL" ? beats : beats.filter((b) => (b.genre || "").toUpperCase() === genreFilter);
              const allChecked = visible.length > 0 && visible.every((b) => selectedIds.has(b.id));
              return (
                <Card className="p-3 border-primary/30 bg-primary/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleSelectAll(visible)}>
                      {allChecked ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
                      {allChecked ? "Desmarcar todos" : "Marcar todos"}
                    </Button>
                    <span className="text-sm font-semibold">
                      {selectedIds.size} selecionado(s)
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={bulkGenre}
                        onChange={(e) => setBulkGenre(e.target.value)}
                      >
                        <option value="">Gênero…</option>
                        {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={bulkPack100}
                        onChange={(e) => setBulkPack100(e.target.value as any)}
                        title="Pack 100"
                      >
                        <option value="keep">Pack 100: manter</option>
                        <option value="yes">Pack 100: sim</option>
                        <option value="no">Pack 100: não</option>
                      </select>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        value={bulkPack300}
                        onChange={(e) => setBulkPack300(e.target.value as any)}
                        title="Pack 300"
                      >
                        <option value="keep">Pack 300: manter</option>
                        <option value="yes">Pack 300: sim</option>
                        <option value="no">Pack 300: não</option>
                      </select>
                      <Button size="sm" onClick={applyBulk} disabled={selectedIds.size === 0}>
                        <Save className="w-4 h-4 mr-1" /> Aplicar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })()}

            <div className="space-y-2">
              {(genreFilter === "ALL" ? beats : beats.filter((b) => (b.genre || "").toUpperCase() === genreFilter)).map((b, i, arr) => (
                <Card key={b.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <div className="md:col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedIds.has(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        aria-label="Selecionar"
                      />
                    </div>
                    <Input className="md:col-span-3" value={b.name} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, name: e.target.value } : x))} />
                    <Input className="md:col-span-3" value={b.url} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, url: e.target.value } : x))} />
                    <select
                      className="md:col-span-1 h-10 rounded-md border border-input bg-background px-2 text-sm"
                      value={b.genre ?? ""}
                      onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, genre: e.target.value } : x))}
                    >
                      <option value="">—</option>
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <Input className="md:col-span-1" placeholder="Key" value={b.key ?? ""} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, key: e.target.value } : x))} />
                    <Input className="md:col-span-1" placeholder="BPM" value={b.bpm ?? ""} onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, bpm: e.target.value } : x))} />
                    <div className="md:col-span-2 flex gap-1 justify-end">
                      <label className="cursor-pointer">
                        <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac" className="hidden" onChange={(e) => e.target.files?.[0] && handleUploadForBeat(b.id, e.target.files[0])} />
                        <Button size="icon" variant="outline" asChild disabled={uploadingId === b.id} title="Substituir áudio (upload)">
                          <span><Upload className="w-4 h-4" /></span>
                        </Button>
                      </label>
                      <Button size="icon" variant="ghost" onClick={() => moveBeat(b.id, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveBeat(b.id, 1)} disabled={i === arr.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                      <Button size="icon" variant="outline" onClick={() => updateBeat(b.id, { name: b.name, url: b.url, key: b.key, bpm: b.bpm, genre: b.genre, no_pack_100: b.no_pack_100, no_pack_300: b.no_pack_300 })}><Save className="w-4 h-4" /></Button>
                      <Button size="icon" variant={b.active ? "outline" : "secondary"} title={b.active ? "Desativar" : "Ativar"} onClick={() => updateBeat(b.id, { active: !b.active })}>
                        {b.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteBeat(b.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!b.no_pack_100}
                        onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, no_pack_100: e.target.checked } : x))}
                      />
                      <span>Pack 100</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!b.no_pack_300}
                        onChange={(e) => setBeats(beats.map((x) => x.id === b.id ? { ...x, no_pack_300: e.target.checked } : x))}
                      />
                      <span>Pack 300</span>
                    </label>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {b.image_url ? (
                        <img src={b.image_url} alt="Capa do beat" className="rounded-lg object-cover border border-border" style={{ width: 120, height: 120 }} />
                      ) : (
                        <div className="rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground text-center px-1 border border-border" style={{ width: 120, height: 120 }}>sem foto</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Capa do beat (JPG, PNG, WEBP)</Label>
                      <div className="flex gap-2 mt-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleUploadImageForBeat(b.id, e.target.files[0])}
                          />
                          <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImageId === b.id}>
                            <span>
                              <Upload className="w-3 h-3 mr-1" />
                              {uploadingImageId === b.id ? "Enviando..." : b.image_url ? "Trocar foto" : "Enviar foto"}
                            </span>
                          </Button>
                        </label>
                        {b.image_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => updateBeat(b.id, { image_url: null })}>
                            Remover
                          </Button>
                        )}
                      </div>
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