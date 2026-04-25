import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User } from "lucide-react";
import { BeatPlayer, type BeatItem } from "@/components/BeatPlayer";
import { VideoPreview } from "@/components/VideoPreview";

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
  { id: "stat-1", n: "+2.500", l: "Artistas que compraram" },
  { id: "stat-2", n: "+10M", l: "Streams gerados" },
  { id: "stat-3", n: "4.9/5", l: "Avaliação média" },
  { id: "stat-4", n: "100%", l: "Royalty free" },
];
const faq = [
  { q: "Posso usar os beats no Spotify e YouTube?", a: "Sim! Todos os beats são 100% royalty free. Você pode monetizar onde quiser." },
  { q: "Como recebo o pack?", a: "Após a compra, você recebe acesso imediato ao link de download por e-mail." },
  { q: "Tem garantia?", a: "Sim, 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro." },
];

export default function IndexPage() {
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");

  const CONTAINER = "mx-auto w-full max-w-[1400px] px-6 md:px-10";

  useEffect(() => {
    (async () => {
      const [{ data: settings }, { data: imgs }, { data: bts }] = await Promise.all([
        supabase.from("site_settings").select("key,value"),
        supabase.from("proof_images").select("url").order("position", { ascending: true }),
        supabase.from("beats").select("name,url,key,bpm").order("position", { ascending: true }),
      ]);
      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      setPreviewVideo(map["preview_video"] ?? null);
      setCheckoutUrl(map["checkout_url"] ?? "");
      setProofImages(
        (imgs ?? []).map((r: any) =>
          String(r.url).replace(/([?&])dl=1\b/, "$1raw=1")
        )
      );
      setBeats((bts ?? []) as BeatItem[]);
    })();
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
      <section className="relative overflow-hidden pt-32 pb-20 md:pb-24" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className={`${CONTAINER} text-center`}>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95]">
            PACK DE 100 BEATS
          </h1>
          <p className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-accent">
            100% ROYALTY FREE
          </p>

          <p className="mt-8 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Pack completo, profissional e pronto para uso. Funk, Trap, New Jazz, Hard, Sampled, R&B e muito mais.
          </p>

          <div className="mt-12 mx-auto max-w-2xl">
            <Card className="relative aspect-video overflow-hidden border-border/60 bg-card group">
              {previewVideo ? (
                <VideoPreview url={previewVideo} />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.25_0.05_145/0.4),transparent_70%)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-[var(--shadow-glow)]">
                      <Play className="h-8 w-8 text-primary-foreground fill-current ml-1" />
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>

          <p className="mt-6 text-sm">
            <span className="text-primary font-bold">Uso liberado</span>
            <span className="text-muted-foreground"> para Spotify, YouTube e etc...</span>
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Button onClick={handleCheckout} size="lg" variant="cta" className="text-base h-14 px-10 font-bold tracking-wide">
              <Flame className="h-5 w-5 mr-2" />
              <span>GARANTIR MEU PACK</span>
            </Button>

            <a
              href="#avaliacoes"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("avaliacoes")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group mt-2 flex flex-col items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="font-medium tracking-wide">Veja as avaliações do pack</span>
              <ChevronDown className="h-5 w-5 animate-bounce group-hover:text-primary" />
            </a>
          </div>

        </div>
      </section>

      <section id="avaliacoes" className="py-20 md:py-24 bg-card/30 border-y border-border/50 scroll-mt-20">
        <div className="container max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Avaliações do pack</h2>
            <p className="mt-3 text-muted-foreground">O que quem já comprou está dizendo</p>
          </div>
          {proofImages.length > 0 ? (
            <div className="grid grid-cols-2">
              {proofImages.map((src, i) => {
                const isLastRow = i >= proofImages.length - (proofImages.length % 2 === 0 ? 2 : 1);
                const isRightCol = i % 2 === 1;
                return (
                  <div
                    key={i}
                    className={`p-3 md:p-4 ${isRightCol ? "border-l border-border" : ""} ${!isLastRow ? "border-b border-border" : ""}`}
                  >
                    <div className="relative w-full aspect-square">
                      <img
                        src={src}
                        alt={`Prova social ${i + 1}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                  <Card key={i} className="p-6 border-border/60 bg-background flex flex-col">
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 flex-1">{`"${t.text}"`}</p>
                    <div className="mt-5 pt-4 border-t border-border/60">
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 md:py-24 border-t border-border/50">
        <div className={CONTAINER}>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
            {genres.map((g, i) => (
              <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 text-xs tracking-wider uppercase">
                {g}
              </Badge>
            ))}
          </div>
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-primary/40 text-primary">
              <span>Ouça antes de comprar</span>
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              10 beats em preview
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">
              1 minuto de prévia · No pack você recebe a versão completa
            </p>
          </div>

          {beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-5xl mx-auto">
              {beats.slice(0, 10).map((b, i) => (
                <BeatPlayer key={`${b.name}-${i}`} beat={b} index={i} />
              ))}
            </div>
          ) : (
            <Card className="p-10 border-dashed border-border/60 bg-card/40 text-center max-w-4xl mx-auto">
              <Music2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum beat enviado ainda.</p>
            </Card>
          )}
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className={CONTAINER}>
          <Card className="relative overflow-hidden border-primary/40 bg-card p-8 md:p-12 text-center max-w-2xl mx-auto" style={{ boxShadow: "var(--shadow-glow)" }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "var(--gradient-hero)" }} />
            <div className="relative">
              <Badge className="mb-6 bg-accent text-accent-foreground border-0 tracking-widest uppercase text-xs">
                <span>Oferta limitada</span>
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Pack de 100 Beats</h2>
              <div className="mt-6 flex items-center justify-center">
                <span className="text-4xl md:text-5xl font-black text-primary">R$ 19,90</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Pagamento único · Acesso vitalício</p>

              <div className="mt-8 space-y-2 text-left max-w-sm mx-auto">
                {features.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleCheckout} size="lg" variant="cta" className="mt-10 w-full h-14 text-base font-bold tracking-wide">
                <Download className="h-5 w-5 mr-2" />
                <span>QUERO MEU PACK AGORA</span>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Garantia incondicional de 7 dias</span>
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/30">
        <div className={`${CONTAINER} py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center`}>
          {stats.map((s) => (
            <div key={s.id}>
              <div className="text-2xl md:text-3xl font-black">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className={CONTAINER}>
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-accent/40 text-accent">
              <span>O que vem no pack</span>
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Tudo que você precisa para soltar hits
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <Card key={i} className="p-5 flex items-start gap-3 border-border/60 bg-card hover:border-primary/40 transition-colors">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm md:text-base">{f}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 border-t border-border/50">
        <div className={`${CONTAINER} max-w-3xl`}>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-10">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faq.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  <span>{item.q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border/50 py-12">
        <div className={`${CONTAINER} flex flex-col items-center gap-6`}>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <a
              href="mailto:novarealezaprods@gmail.com"
              className="group flex items-center gap-2.5 text-sm text-foreground/90 hover:text-primary transition-colors"
            >
              <span className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
              </span>
              <span className="font-medium">novarealezaprods@gmail.com</span>
            </a>
            <a
              href="https://wa.me/5511978768141"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 text-sm text-foreground/90 hover:text-primary transition-colors"
            >
              <span className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
              </span>
              <span className="font-medium">(11) 97876-8141</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Cléber Marques Ernanandes</span>
            </div>
            <div className="hidden sm:block h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>CNPJ 51.800.800/0001-28</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/70">
            {`© ${new Date().getFullYear()} Nova Realeza. Todos os direitos reservados.`}
          </p>
        </div>
      </footer>
    </div>
  );
}
