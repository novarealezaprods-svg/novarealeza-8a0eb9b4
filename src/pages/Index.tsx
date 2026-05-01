import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User, Skull, Trophy, Music, Globe, Zap, Lock, ShieldCheck as Shield } from "lucide-react";
import { BeatPlayer, type BeatItem } from "@/components/BeatPlayer";
import { VideoPreview } from "@/components/VideoPreview";
import { normalizeDirectUrl } from "@/lib/normalize-url";

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
    const els = document.querySelectorAll<HTMLElement>(".ba-card");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-32 pb-20 md:pb-24" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className={`${CONTAINER} text-center flex flex-col items-center gap-6 md:gap-8`}>
          <h1 className="font-black tracking-tight leading-[0.95] text-4xl sm:text-6xl md:text-7xl lg:text-8xl">
            Pare de Enterrar Sua Música
            <br />
            em Beat <span className="text-accent">FREE</span>
          </h1>

          <p className="hero-fade hero-subtitle mx-auto max-w-xl leading-relaxed text-base md:text-lg" style={{ animationDelay: "200ms" }}>
            100 beats profissionais por menos que o valor de um lanche. Grave hoje. Poste amanhã. Estoure depois.
          </p>

          <div className="mx-auto max-w-2xl w-full">
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

          <div className="hero-checks">
            {["Sem copyright strike", "Sem pagar produtor", "Sem desculpa pra não gravar"].map((t, i) => (
              <span
                key={i}
                className="hero-check"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span className="hero-check-badge">
                  <Check className="hero-check-icon" strokeWidth={3} />
                </span>
                <span className="hero-check-label">{t}</span>
              </span>
            ))}
          </div>

          <div className="hero-cta-block flex flex-col items-center w-full">
            <button
              onClick={handleCheckout}
              className="hero-cta inline-flex items-center justify-center whitespace-nowrap"
            >
              <span className="hero-cta-shine" aria-hidden="true" />
              <span className="hero-cta-text">QUERO MEUS 100 BEATS AGORA</span>
            </button>
            <p className="hero-cta-sub">
              <Lock className="hero-cta-sub-icon" strokeWidth={2.5} />
              <span>Pagamento seguro</span>
              <span className="hero-cta-sub-sep" aria-hidden="true">·</span>
              <span>Acesso imediato</span>
              <span className="hero-cta-sub-sep" aria-hidden="true">·</span>
              <span>7 dias de garantia</span>
            </p>
          </div>

        </div>
      </section>

      <section className="py-20 md:py-24 border-t border-border/50">
        <div className={CONTAINER}>
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

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
            {genres.map((g, i) => (
              <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 text-xs tracking-wider uppercase">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section id="avaliacoes" className="py-20 md:py-24 bg-card/30 border-y border-border/50 scroll-mt-20">
        <div className="container max-w-3xl mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col items-center text-white">
            <span className="text-sm font-semibold">Veja as avaliações do pack</span>
            <ChevronDown className="hero-reviews-arrow h-5 w-5 mt-1" />
          </div>
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
                        src={normalizeDirectUrl(src)}
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

      <section className="py-20 md:py-24 bg-background border-t border-border/50">
        <div className={CONTAINER}>
          {/* BLOCO 1 — Antes vs Depois */}
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              O que muda quando você
              <br />
              <span>para de usar beat </span>
              <span className="text-accent">FREE</span>
            </h2>
            <div className="mx-auto mt-6 h-[3px] w-20 bg-accent rounded-full" />
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-6 items-center max-w-5xl mx-auto">
            {/* ANTES */}
            <div
              className="ba-card left rounded-lg p-6 md:p-8 border-l-4 border-l-destructive bg-[#0a0a0a]"
            >
              <div className="flex items-center gap-3 mb-6">
                <Skull className="h-6 w-6 text-destructive" />
                <h3 className="text-2xl font-black uppercase tracking-wide text-destructive">
                  Antes
                </h3>
              </div>
              <ul className="flex flex-col" style={{ gap: "14px" }}>
                {[
                  "Beat free que todo mundo já ouviu",
                  "Risco de copyright strike no YouTube",
                  "Som amador que entrega você antes de tocar",
                  "Sem variedade, sem identidade",
                  "Gastando tempo garimpando instrumental",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 font-medium leading-snug"
                    style={{ fontSize: "15px", color: "#aaaaaa", animationDelay: `${300 + i * 100}ms` }}
                  >
                    <span className="text-destructive font-bold flex-shrink-0">❌</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DIVISOR CENTRAL */}
            <div className="flex items-center justify-center my-2 md:my-0">
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
                fill="none"
                aria-hidden="true"
                className="ba-x-svg"
              >
                {/* Traço 1: cima-esquerda → baixo-direita (rabiscado, irregular) */}
                <path
                  d="M10 9 Q 18 17, 24 24 T 38 38 Q 45 46, 51 52"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="ba-x-stroke ba-x-stroke-1"
                />
                {/* Traço 2: cima-direita → baixo-esquerda */}
                <path
                  d="M51 8 Q 43 17, 36 23 T 22 37 Q 14 45, 9 52"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="ba-x-stroke ba-x-stroke-2"
                />
              </svg>
            </div>

            {/* DEPOIS */}
            <div
              className="ba-card right rounded-lg p-6 md:p-8 border-l-4 border-l-primary bg-[#0a0a0a]"
            >
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-black uppercase tracking-wide text-primary">
                  Depois
                </h3>
              </div>
              <ul className="flex flex-col" style={{ gap: "14px" }}>
                {[
                  "100 beats exclusivos e profissionais",
                  "100% royalty free — Spotify, YouTube, sem medo",
                  "Som que posiciona você como artista sério",
                  "Funk, Trap, R&B, New Jazz e muito mais",
                  "Grave quando quiser, sem depender de ninguém",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 font-medium leading-snug text-white"
                    style={{ fontSize: "15px", animationDelay: `${300 + i * 100}ms` }}
                  >
                    <span className="text-primary font-bold flex-shrink-0">✅</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BLOCO 2 — Métricas */}
          <div className="mt-16 md:mt-20 rounded-2xl bg-card/60 border border-border/60 py-10 px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <Music className="h-7 w-7 text-primary mb-3" />
                <div className="text-4xl md:text-5xl font-black text-foreground">100 Beats</div>
                <div className="mt-2 text-xs md:text-sm text-muted-foreground">Prontos para gravar agora</div>
              </div>
              <div className="flex flex-col items-center md:border-x md:border-border/60">
                <Globe className="h-7 w-7 text-primary mb-3" />
                <div className="text-4xl md:text-5xl font-black text-foreground">6 Estilos</div>
                <div className="mt-2 text-xs md:text-sm text-muted-foreground">Funk, Trap, R&B, New Jazz, Hard, Sampled</div>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="h-7 w-7 text-primary mb-3" />
                <div className="text-4xl md:text-5xl font-black text-foreground">100% Royalty Free</div>
                <div className="mt-2 text-xs md:text-sm text-muted-foreground">Spotify, YouTube e muito mais sem strike</div>
              </div>
            </div>
          </div>

          {/* BLOCO 3 — Depoimentos */}
          <div className="mt-16 md:mt-20">
            <h3 className="text-3xl md:text-4xl font-black tracking-tight text-center text-foreground mb-10">
              Artistas que pararam de usar beat free
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Lucas M.", text: "Eu lançava música e ficava com vergonha de divulgar por causa do beat. Depois do pack gravei 4 músicas em uma semana. A qualidade mudou tudo.", seed: "lucas" },
                { name: "Kauan R.", text: "Gastava horas procurando beat no YouTube e sempre tomava strike. Agora tenho 100 opções prontas e posto sem medo nenhum.", seed: "kauan" },
                { name: "Thiago S.", text: "Por R$19,90 eu achei que ia ser furada. Errei feio. É o melhor investimento que fiz na minha carreira até agora.", seed: "thiago" },
              ].map((t, i) => (
                <Card key={i} className="p-6 border-border/60 bg-card flex flex-col items-center text-center">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}`}
                    alt={t.name}
                    className="h-20 w-20 rounded-full border-2 border-primary/40 bg-muted mb-4"
                  />
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="flex gap-0.5 my-2">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{`"${t.text}"`}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* BLOCO 4 — CTA Final */}
          <div className="mt-16 md:mt-20 text-center flex flex-col items-center gap-4">
            <p className="text-lg md:text-xl font-semibold text-foreground">
              Mais de 1.200 artistas já escolheram parar de usar beat free
            </p>
            <Button onClick={handleCheckout} size="lg" variant="cta" className="h-14 px-10 text-base font-bold tracking-wide">
              <span>Quero meus 100 Beats por R$19,90 →</span>
            </Button>
            <p className="text-sm text-primary font-medium">
              ✓ Acesso imediato ✓ 7 dias de garantia ✓ Sem copyright strike
            </p>
          </div>
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
          <div className="flex items-center gap-2.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Garantia incondicional de 7 dias</span>
          </div>

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

      <a
        href="https://wa.me/5511978768141"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco no WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden="true">
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.158-.673.158-1.017 0-.502-1.69-1.063-2.122-1.205zm-3.137 7.945c-5.05 0-9.146-4.094-9.146-9.144 0-5.05 4.096-9.144 9.146-9.144 5.05 0 9.144 4.094 9.144 9.144 0 5.05-4.094 9.144-9.144 9.144zm0-20.176C9.974 4.974 4.97 9.978 4.97 16.006c0 2.2.65 4.226 1.752 5.954L4 28.002l6.198-2.71a11.012 11.012 0 0 0 5.775 1.624c6.03 0 11.034-5.005 11.034-11.034 0-6.03-5.005-11.034-11.034-11.034z"/>
        </svg>
      </a>
    </div>
  );
}
