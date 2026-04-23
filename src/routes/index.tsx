import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, Upload } from "lucide-react";
import { BeatPlayer, type BeatItem } from "@/components/BeatPlayer";
import { EditableProvider, EditableText, EditModeToggle } from "@/components/EditableContext";
import { VideoPreview } from "@/components/VideoPreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pack de 100 Beats — 100% Royalty Free | Nova Realeza" },
      { name: "description", content: "Pack completo de 100 beats profissionais, prontos para uso. Funk, Trap, New Jazz, Hard, Sampled, R&B e muito mais. 100% royalty free." },
      { property: "og:title", content: "Pack de 100 Beats — 100% Royalty Free" },
      { property: "og:description", content: "Pack completo, profissional e pronto para uso. Liberado para Spotify, YouTube e mais." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: IndexWrapper,
});

const genres = ["Funk", "Trap", "New Jazz", "Hard", "Sampled", "R&B", "Drill", "Boom Bap"];

const features = [
  "100 beats profissionais prontos para uso",
  "100% royalty free — você fica com tudo",
  "Liberado para Spotify, YouTube, TikTok",
  "Mixados e masterizados em alta qualidade",
  "Acesso vitalício + atualizações futuras",
];

const testimonials = [
  { name: "MC Vinny", text: "Lancei 3 sons em 1 semana com o pack. Qualidade absurda.", role: "Artista independente" },
  { name: "Lucas Prod", text: "Os stems salvaram minha vida. Consigo customizar tudo.", role: "Beatmaker" },
  { name: "Maya R&B", text: "Variedade insana de estilos. Vale cada centavo.", role: "Cantora" },
];

const stats = [
  { id: "stat-1", n: "+2.500", l: "Produtores" },
  { id: "stat-2", n: "+10M", l: "Streams gerados" },
  { id: "stat-3", n: "4.9/5", l: "Avaliação média" },
  { id: "stat-4", n: "100%", l: "Royalty free" },
];

const faq = [
  { q: "Posso usar os beats no Spotify e YouTube?", a: "Sim! Todos os beats são 100% royalty free. Você pode monetizar onde quiser." },
  { q: "Como recebo o pack?", a: "Após a compra, você recebe acesso imediato ao link de download por e-mail." },
  { q: "Tem garantia?", a: "Sim, 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro." },
];

function IndexWrapper() {
  return (
    <EditableProvider>
      <Index />
      <EditModeToggle />
    </EditableProvider>
  );
}

function Index() {
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPreviewVideo(localStorage.getItem("nr_preview_video"));
    setCheckoutUrl(localStorage.getItem("nr_checkout_url") || "");
    try {
      setProofImages(JSON.parse(localStorage.getItem("nr_proof_images") || "[]"));
      setBeats(JSON.parse(localStorage.getItem("nr_beats") || "[]"));
    } catch {}
  }, []);

  const handleCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Music2 className="h-4 w-4 text-primary" />
            <EditableText id="brand">Nova Realeza</EditableText>
          </div>
          <Link to="/admin" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden pt-32 pb-20"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Badge variant="outline" className="mb-6 border-border/60 bg-card/40 backdrop-blur text-xs tracking-widest uppercase">
            <Flame className="h-3 w-3 mr-1 text-accent" />
            <EditableText id="hero-badge">Preço por tempo limitado</EditableText>
          </Badge>

          <EditableText as="h1" id="hero-title" className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] block">
            PACK DE 100 BEATS
          </EditableText>
          <EditableText as="p" id="hero-subtitle" className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-accent block">
            100% ROYALTY FREE
          </EditableText>

          <EditableText as="p" id="hero-desc" className="mt-8 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground block">
            Pack completo, profissional e pronto para uso. Funk, Trap, New Jazz, Hard, Sampled, R&B e muito mais.
          </EditableText>

          {/* Video / preview */}
          <div className="mt-12 mx-auto max-w-2xl">
            <Card className="relative aspect-video overflow-hidden border-border/60 bg-card group">
              {previewVideo ? (
                getEmbedUrl(previewVideo) ? (
                  <iframe
                    src={getEmbedUrl(previewVideo)!}
                    title="Preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <video src={previewVideo} controls className="absolute inset-0 w-full h-full object-cover" />
                )
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.25_0.05_145/0.4),transparent_70%)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-[var(--shadow-glow)]">
                      <Play className="h-8 w-8 text-primary-foreground fill-current ml-1" />
                    </div>
                    <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary uppercase tracking-widest">
                      Enviar vídeo de preview
                    </Link>
                  </div>
                </>
              )}
            </Card>
          </div>

          <p className="mt-6 text-sm">
            <EditableText id="hero-released" className="text-primary font-bold">Uso liberado</EditableText>
            <EditableText id="hero-released-2" className="text-muted-foreground"> para Spotify, YouTube e etc...</EditableText>
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Button size="lg" variant="cta" className="text-base h-14 px-10 font-bold tracking-wide">
              <Flame className="h-5 w-5 mr-2" />
              <EditableText id="hero-cta">GARANTIR MEU PACK</EditableText>
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <EditableText id="hero-guarantee">Garantia de 7 dias · Pagamento seguro</EditableText>
            </div>
          </div>

          {/* Genres */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-2">
            {genres.map((g, i) => (
              <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 text-xs tracking-wider uppercase">
                <EditableText id={`genre-${i}`}>{g}</EditableText>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.id}>
              <EditableText as="div" id={`${s.id}-n`} className="text-2xl md:text-3xl font-black block">{s.n}</EditableText>
              <EditableText as="div" id={`${s.id}-l`} className="text-xs uppercase tracking-widest text-muted-foreground mt-1 block">{s.l}</EditableText>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-accent/40 text-accent">
              <EditableText id="features-badge">O que vem no pack</EditableText>
            </Badge>
            <EditableText as="h2" id="features-title" className="text-4xl md:text-5xl font-black tracking-tight block">
              Tudo que você precisa para soltar hits
            </EditableText>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <Card key={i} className="p-5 flex items-start gap-3 border-border/60 bg-card hover:border-primary/40 transition-colors">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <EditableText id={`feature-${i}`} className="text-sm md:text-base">{f}</EditableText>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card/30 border-y border-border/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-14">
            <EditableText as="h2" id="testi-title" className="text-4xl md:text-5xl font-black tracking-tight block">Feedbacks reais</EditableText>
            <EditableText as="p" id="testi-subtitle" className="mt-3 text-muted-foreground block">Quem já está usando o pack</EditableText>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {proofImages.length > 0
              ? proofImages.map((src, i) => (
                  <Card key={i} className="overflow-hidden border-border/60 bg-background">
                    <img src={src} alt={`Prova social ${i + 1}`} className="w-full h-72 object-cover" />
                  </Card>
                ))
              : testimonials.map((t, i) => (
                  <Card key={i} className="p-6 border-border/60 bg-background">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <EditableText as="p" id={`testi-${i}-text`} multiline className="text-sm leading-relaxed text-foreground/90 block">{`"${t.text}"`}</EditableText>
                    <div className="mt-5 pt-4 border-t border-border/60">
                      <EditableText as="div" id={`testi-${i}-name`} className="font-bold text-sm block">{t.name}</EditableText>
                      <EditableText as="div" id={`testi-${i}-role`} className="text-xs text-muted-foreground block">{t.role}</EditableText>
                    </div>
                  </Card>
                ))}
          </div>
          {proofImages.length === 0 && (
            <div className="mt-8 text-center">
              <Link to="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
                <Upload className="h-3 w-3" /> Enviar fotos de prova social
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Beats preview */}
      <section className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-primary/40 text-primary">
              <EditableText id="beats-badge">Ouça antes de comprar</EditableText>
            </Badge>
            <EditableText as="h2" id="beats-title" className="text-4xl md:text-5xl font-black tracking-tight block">
              10 beats em preview
            </EditableText>
            <EditableText as="p" id="beats-subtitle" className="mt-3 text-muted-foreground text-sm block">
              Players com waveform · 1 minuto de prévia · No pack você recebe a versão completa
            </EditableText>
          </div>

          {beats.length > 0 ? (
            <div className="space-y-3">
              {beats.slice(0, 10).map((b, i) => (
                <BeatPlayer key={`${b.name}-${i}`} beat={b} index={i} />
              ))}
            </div>
          ) : (
            <Card className="p-10 border-dashed border-border/60 bg-card/40 text-center">
              <Music2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum beat enviado ainda.</p>
              <Link to="/admin" className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary hover:underline">
                <Upload className="h-3 w-3" /> Enviar beats no admin
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-6">
          <Card className="relative overflow-hidden border-primary/40 bg-card p-8 md:p-12 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "var(--gradient-hero)" }} />
            <div className="relative">
              <Badge className="mb-6 bg-accent text-accent-foreground border-0 tracking-widest uppercase text-xs">
                <EditableText id="price-badge">Oferta limitada</EditableText>
              </Badge>
              <EditableText as="h2" id="price-title" className="text-3xl md:text-5xl font-black tracking-tight block">Pack de 100 Beats</EditableText>
              <div className="mt-6 flex items-center justify-center gap-3">
                <EditableText as="span" id="price-old" className="text-lg text-muted-foreground line-through">R$ 97</EditableText>
                <EditableText as="span" id="price-new" className="text-5xl md:text-6xl font-black text-primary">R$ 20</EditableText>
              </div>
              <EditableText as="p" id="price-note" className="mt-2 text-sm text-muted-foreground block">Pagamento único · Acesso vitalício</EditableText>

              <div className="mt-8 space-y-2 text-left max-w-sm mx-auto">
                {features.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <EditableText id={`price-feature-${i}`}>{f}</EditableText>
                  </div>
                ))}
              </div>

              <Button size="lg" variant="cta" className="mt-10 w-full h-14 text-base font-bold tracking-wide">
                <Download className="h-5 w-5 mr-2" />
                <EditableText id="price-cta">QUERO MEU PACK AGORA</EditableText>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <EditableText id="price-guarantee">Garantia incondicional de 7 dias</EditableText>
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-3xl px-6">
          <EditableText as="h2" id="faq-title" className="text-3xl md:text-4xl font-black tracking-tight text-center mb-10 block">
            Perguntas frequentes
          </EditableText>
          <Accordion type="single" collapsible className="w-full">
            {faq.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  <EditableText id={`faq-q-${i}`}>{item.q}</EditableText>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <EditableText id={`faq-a-${i}`} multiline>{item.a}</EditableText>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 text-center text-xs text-muted-foreground">
        <EditableText id="footer">{`© ${new Date().getFullYear()} Nova Realeza. Todos os direitos reservados.`}</EditableText>
      </footer>
    </div>
  );
}
