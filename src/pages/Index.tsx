import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User, Skull, Trophy, Music, Globe, Zap, Lock, ShieldCheck as Shield, MessageCircle, AlertTriangle } from "lucide-react";
import { BeatPlayer, type BeatItem, playUrl, pauseCurrent, useBeatSnap } from "@/components/BeatPlayer";
import { GenrePlaylists } from "@/components/GenrePlaylists";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight, Play as PlayIcon, Pause as PauseIcon, Loader2 } from "lucide-react";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { VideoPreview } from "@/components/VideoPreview";
import { ScarcityBar } from "@/components/ScarcityBar";
import garantiaBadge from "@/assets/7-dias-garantia.png";

const genres = ["BOOMBAP/RAP", "FUNK", "TRAP", "Hard", "Sampled", "R&B", "Drill", "EXPERIMENTAL"];
const features = [
  "100 beats profissionais prontos para uso",
  "Liberado para Spotify, YouTube, TikTok",
  "Mixados e masterizados em alta qualidade",
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

const BEAT_META: { name: string; genre: string }[] = [
  { name: "TRAP", genre: "FUNK" },
  { name: "TRAP", genre: "FUNK" },
  { name: "Type Alee", genre: "BOOMBAP/RAP" },
  { name: "Type BOOMBAP/RAP", genre: "BOOMBAP/RAP" },
  { name: "Type Hood Drill", genre: "DRILL" },
  { name: "Type Skrilla", genre: "FUNK" },
  { name: "Type Ambient Hood", genre: "HOOD" },
  { name: "Type Don Toliver", genre: "FUNK" },
  { name: "Nave Nova na Favela", genre: "BOOMBAP/RAP" },
  { name: "Type Florida", genre: "FUNK" },
];

export default function IndexPage() {
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [checkoutUrlSupreme, setCheckoutUrlSupreme] = useState<string>("");
  const [openBeatIndex, setOpenBeatIndex] = useState<number | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; url: string; variant: "green" | "gold" }>({ open: false, url: "", variant: "green" });

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

  // Scroll reveal animations
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [beats.length, proofImages.length]);

  useEffect(() => {
    (async () => {
      const [{ data: settings }, { data: imgs }, { data: bts }] = await Promise.all([
        supabase.from("site_settings").select("key,value"),
        supabase.from("proof_images").select("url").order("position", { ascending: true }),
        supabase.from("beats").select("name,url,key,bpm,image_url,genre,active").eq("active", true).order("position", { ascending: true }),
      ]);
      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      setPreviewVideo(map["preview_video"] ?? null);
      setCheckoutUrl(map["checkout_url"] ?? "");
      setCheckoutUrlSupreme(map["checkout_url_supreme"] ?? "");
      setProofImages(
        (imgs ?? []).map((r: any) =>
          String(r.url).replace(/([?&])dl=1\b/, "$1raw=1")
        )
      );
      setBeats((bts ?? []) as BeatItem[]);
    })();
  }, []);

  const handleCheckout = (urlOverride?: string, variant: "green" | "gold" = "green") => {
    const target = urlOverride || checkoutUrl;
    if (!target) return;
    setDeliveryModal({ open: true, url: target, variant });
  };

  const executeCheckout = (target: string) => {
    if (!target) return;
    // Track AddToCart via GTM dataLayer
    if (typeof window !== "undefined") {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: "AddToCart" });
    }
    // Forward all current URL params (utm_*, fbclid, gclid, etc.) to checkout
    try {
      const url = new URL(target);
      const incoming = new URLSearchParams(window.location.search);
      incoming.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  };

  const handleBasicCheckoutClick = () => {
    setShowUpsell(true);
  };

  const handleContinueBasic = () => {
    setShowUpsell(false);
    handleCheckout();
  };

  const handleGoSupreme = () => {
    setShowUpsell(false);
    // Aguarda o fechamento do dialog (Radix trava o scroll do body) antes de rolar.
    // No mobile, scrollIntoView dispara antes do unlock e não funciona.
    setTimeout(() => {
      const el = document.getElementById("oferta-suprema");
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.pageYOffset - 16;
      window.scrollTo({ top: y, behavior: "smooth" });
    }, 350);
  };

  // ViewContent at 75% scroll
  useEffect(() => {
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.75) {
        fired = true;
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({ event: "ViewContent" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden pt-32 pb-20 md:pb-24" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className={`${CONTAINER} text-center flex flex-col items-center gap-6 md:gap-8`}>
          <h1 className="font-black tracking-tight leading-[0.95] text-4xl sm:text-6xl text-center mx-auto md:text-7xl lg:text-6xl my-[11px]">
            Pare de Enterrar Sua Música
            <br />
            em Beat <span className="text-accent free-riscado">"FREE"</span>
          </h1>

          <p className="hero-fade hero-subtitle mx-auto max-w-xl leading-relaxed text-xs text-muted-foreground mb-3 tracking-wide text-stone-100 md:text-base text-center" style={{ animationDelay: "200ms" }}>
            R$0,19 por beat. Royalty Free. Acesso vitalício
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
            {["Liberado P/ Lançar", "Cada Beat por Centavos", "Sem Desculpas pra Não Gravar"].map((t, i) => (
              <span
                key={i}
                className={`hero-check hero-check-pyramid-${i + 1}`}
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
              onClick={handleBasicCheckoutClick}
              className="hero-cta inline-flex items-center justify-center whitespace-nowrap"
            >
              <span className="hero-cta-shine" aria-hidden="true" />
              <span className="hero-cta-text">QUERO MEUS 100 BEATS POR 19,90</span>
            </button>
            <p className="hero-cta-sub">
              <span aria-hidden="true">🔒</span>
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
          <div className="text-center mb-12 reveal">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Ouça Antes de Comprar
            </h2>
            <div className="mx-auto mt-6 h-[3px] w-20 bg-accent rounded-full" />
            <p className="mt-4 text-[15px] text-center text-white/70">
              Escolha seu estilo e ouça algumas prévias — o beat certo tá aqui
            </p>
          </div>

          {beats.length > 0 ? (
            <GenrePlaylists beats={beats} />
          ) : (
            <Card className="p-10 border-dashed border-border/60 bg-card/40 text-center max-w-4xl mx-auto">
              <Music2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum beat enviado ainda.</p>
            </Card>
          )}

          <div className="mt-10 px-4 flex flex-wrap items-center justify-center gap-2 md:gap-2.5 reveal">
            {genres.map((g, i) => (
              <Badge key={i} variant="secondary" className="rounded-full px-[10px] py-1 md:px-4 md:py-1.5 text-[11px] md:text-xs tracking-wider uppercase">
                {g}
              </Badge>
            ))}
          </div>

          <div className="flex justify-center" style={{ marginTop: 32 }}>
            <button
              onClick={handleBasicCheckoutClick}
              className="hero-cta inline-flex items-center justify-center whitespace-nowrap"
            >
              <span className="hero-cta-shine" aria-hidden="true" />
              <span className="hero-cta-text">QUERO MEUS 100 BEATS POR R$19,90</span>
            </button>
          </div>
          <div className="mt-6 max-w-md mx-auto">
            <ScarcityBar />
          </div>
        </div>
      </section>

      <section id="avaliacoes" className="py-20 md:py-24 bg-card/30 border-y border-border/50 scroll-mt-20">
        <div className="container max-w-3xl mx-auto px-4 md:px-6">
          <div className="mb-8 flex flex-col items-center text-white">
            <span className="text-sm font-semibold">Veja as avaliações do pack</span>
            <ChevronDown className="hero-reviews-arrow h-5 w-5 mt-1" />
          </div>
          <div className="text-center mb-8 md:mb-12 reveal">
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
                        decoding="async"
                        width="600"
                        height="600"
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

      <section
        className="border-t border-border/50"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #111111 100%)",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div className={CONTAINER}>
          {/* BLOCO 1 — Antes vs Depois */}
          <div className="text-center reveal" style={{ marginBottom: "48px" }}>
            <h2
              className="font-black tracking-tight text-white leading-[1.1] ba-title"
            >
              O que muda quando você
              <br />
              <span>para de usar beat </span>
              <span style={{ color: "#E24B4A" }}>"FREE"</span>
            </h2>
            <div
              className="mx-auto"
              style={{
                marginTop: "20px",
                width: "60px",
                height: "3px",
                borderRadius: "2px",
                background: "#E24B4A",
              }}
            />
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-6 items-center max-w-5xl mx-auto">
            {/* ANTES */}
            <div
              className="ba-card left rounded-lg reveal reveal-left"
              style={{
                padding: "32px",
                background: "#0d0d0d",
                borderLeft: "3px solid #E24B4A",
              }}
            >
              <div
                className="flex items-center gap-3"
                style={{ marginBottom: "24px" }}
              >
                <Skull className="h-6 w-6" style={{ color: "#E24B4A" }} />
                <h3
                  className="font-black uppercase tracking-wide"
                  style={{ fontSize: "20px", color: "#E24B4A" }}
                >
                  Antes
                </h3>
              </div>
              <ul className="flex flex-col" style={{ gap: "16px" }}>
                {[
                  "Beat free que todo mundo já ouviu",
                  "Risco de copyright strike no YouTube",
                  "Som amador que entrega você antes de tocar",
                  "Sem variedade, sem identidade",
                  "Gastando tempo garimpando instrumental",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 leading-snug ba-item"
                    style={{
                      fontSize: "15px",
                      color: "#aaaaaa",
                      fontWeight: 500,
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    <span style={{ color: "#E24B4A" }} className="font-bold flex-shrink-0">❌</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DIVISOR CENTRAL */}
            <div className="flex items-center justify-center my-2 md:my-0">
              <div className="ba-arrow" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    className="ba-x-line ba-x-line-1"
                    d="M12 12 L36 36"
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    className="ba-x-line ba-x-line-2"
                    d="M36 12 L12 36"
                    stroke="#ffffff"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* DEPOIS */}
            <div
              className="ba-card right rounded-lg reveal reveal-right"
              style={{
                padding: "32px",
                background: "#0d0d0d",
                borderLeft: "3px solid #39FF14",
              }}
            >
              <div
                className="flex items-center gap-3"
                style={{ marginBottom: "24px" }}
              >
                <Trophy className="h-6 w-6" style={{ color: "#39FF14" }} />
                <h3
                  className="font-black uppercase tracking-wide"
                  style={{ fontSize: "20px", color: "#39FF14" }}
                >
                  Depois
                </h3>
              </div>
              <ul className="flex flex-col" style={{ gap: "16px" }}>
                {[
                  "100 beats exclusivos e profissionais",
                  "100% royalty free — Spotify, YouTube, sem medo",
                  "Som que posiciona você como artista sério",
                  "BOOMBAP/RAP, FUNK, R&B, TRAP e muito mais",
                  "Grave quando quiser, sem depender de ninguém",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 leading-snug ba-item"
                    style={{
                      fontSize: "15px",
                      color: "#ffffff",
                      fontWeight: 500,
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    <span style={{ color: "#39FF14" }} className="font-bold flex-shrink-0">✅</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className="text-center"
            style={{
              marginTop: "32px",
              fontSize: "14px",
              color: "#555555",
              fontWeight: 500,
            }}
          >
            Mais de 1.200 artistas já fizeram essa troca
          </p>

          {/* BLOCO 2 — Card de Compra (Plano Base) */}
          <div className="mt-16 md:mt-20 reveal reveal-zoom max-w-2xl mx-auto">
            <div className="basic-card">
              <div className="basic-card-inner text-center">
                <span className="basic-badge">
                  <Flame className="h-3 w-3" />
                  <span>Oferta limitada</span>
                </span>
                <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight">
                  <span className="basic-title">Pack de 100 Beats</span>
                </h2>
                <p className="mt-2 text-sm md:text-base text-[#9ad9a4] font-semibold tracking-wide">
                  Pagamento único · Acesso vitalício
                </p>

                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="basic-price text-5xl md:text-6xl font-black leading-none">
                    R$ 19,90
                  </span>
                </div>

                <div className="mt-8 space-y-3.5 text-left max-w-md mx-auto">
                  {features.map((f, i) => (
                    <div key={i} className="basic-feature">
                      <span className="basic-feature-check">
                        <Check />
                      </span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="hero-cta-block flex flex-col items-center w-full">
                  <button
                    onClick={handleBasicCheckoutClick}
                    className="hero-cta inline-flex items-center justify-center whitespace-nowrap"
                  >
                    <span className="hero-cta-shine" aria-hidden="true" />
                    <span className="hero-cta-text">QUERO MEU PACK AGORA</span>
                  </button>
                </div>
                <p className="mt-4 text-xs text-[#9ad9a4] flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Garantia incondicional de 7 dias</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFERTA SUPREMA — Gold Edition */}
      <section id="oferta-suprema" className="py-20 md:py-24 border-t border-border/50 relative overflow-hidden scroll-mt-20">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 196, 0, 0.12) 0%, transparent 60%)",
          }}
        />
        <div className={`${CONTAINER} relative`}>
          <div className="text-center mb-10 reveal">
            <span className="supreme-badge">
              <Star className="h-3 w-3 fill-current" />
              <span>Oferta Suprema · Vip</span>
              <Star className="h-3 w-3 fill-current" />
            </span>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              <span className="supreme-title">Seja Um Artista Completo</span>
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              Tudo do pack base + bônus exclusivos pra você sair do amador e dominar o jogo.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="supreme-card">
              <div className="supreme-card-inner text-center">
                {/* sparkles decorativos */}
                <span className="supreme-sparkle" style={{ top: "8%", left: "6%", animationDelay: "0s" }} />
                <span className="supreme-sparkle" style={{ top: "12%", right: "8%", animationDelay: "0.6s" }} />
                <span className="supreme-sparkle" style={{ bottom: "10%", left: "10%", animationDelay: "1.2s" }} />
                <span className="supreme-sparkle" style={{ bottom: "14%", right: "12%", animationDelay: "1.8s" }} />

                <h3 className="text-3xl md:text-4xl font-black tracking-tight">
                  <span className="supreme-title">PACK 300 BEATS+</span>
                </h3>
                <p className="mt-2 text-sm md:text-base text-[#d9c98e] font-semibold tracking-wide">
                  Pacote completo · Acesso vitalício VIP
                </p>

                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="supreme-strike">R$ 197,00</span>
                  <span className="supreme-price text-5xl md:text-6xl font-black leading-none">
                    R$ 47,90
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className="supreme-savings">
                    <Flame className="h-3 w-3" />
                    Economize 75% hoje
                  </span>
                </div>

                <div className="mt-8 space-y-3.5 text-left max-w-md mx-auto">
                  {[
                    "TUDO do pack base (100 beats prontos)",
                    "+200 Beats Adicionados",
                    "TODOS estilos musicais ",
                    "Drum kit profissional (808, kicks, hats)",
                    "Presets de mixagem",
                    "Acesso a comunidade do Whatsapp com artistas de todo Brasil",
                    "Suporte prioritário no WhatsApp",
                  ].map((f, i) => (
                    <div key={i} className="supreme-feature">
                      <span className="supreme-feature-check">
                        <Check />
                      </span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-8 rounded-xl px-4 py-3 max-w-md mx-auto"
                  style={{
                    background: "rgba(255, 196, 0, 0.08)",
                    border: "1px solid rgba(255, 196, 0, 0.28)",
                  }}
                >
                  <p className="text-sm md:text-base font-semibold text-[#fff8e0] flex items-center justify-center gap-2 flex-wrap">
                    <Trophy className="h-4 w-4 text-[#ffd86b]" />
                    <span>Apenas</span>
                    <span className="font-black text-[#ffd86b]" style={{ textShadow: "0 0 12px rgba(255, 215, 0, 0.6)" }}>
                      30 vagas
                    </span>
                    <span>nesse preço</span>
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-center w-full">
                  <button
                    onClick={() => handleCheckout(checkoutUrlSupreme || checkoutUrl, "gold")}
                    className="supreme-cta inline-flex items-center justify-center"
                  >
                    <span className="supreme-cta-shine" aria-hidden="true" />
                    <Download className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">300 BEATS POR 47,90</span>
                  </button>
                </div>
                <div
                  className="mt-6 rounded-xl px-4 py-3 max-w-md mx-auto"
                  style={{
                    background: "rgba(255, 216, 107, 0.08)",
                    border: "1px solid rgba(255, 216, 107, 0.32)",
                  }}
                >
                  <p className="text-sm md:text-base font-semibold text-[#fff5d6] flex items-center justify-center gap-2 flex-wrap">
                    <Flame className="h-4 w-4 text-[#ffd86b]" />
                    <span className="font-black text-[#ffd86b]" style={{ textShadow: "0 0 10px rgba(255, 216, 107, 0.5)" }}>
                      +2.500
                    </span>
                    <span>artistas já garantiram o pack supremo</span>
                  </p>
                </div>
                <p className="mt-4 text-xs text-[#d9c98e] flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Garantia incondicional de 7 dias · Pagamento 100% seguro</span>
                </p>
              </div>
            </div>
          </div>
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
          <div className="text-center mb-14 reveal">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase border-accent/40 text-accent">
              <span>O que vem no pack</span>
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Tudo que você precisa para soltar hits
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <Card key={i} className="p-5 flex items-start gap-3 border-border/60 bg-card hover:border-primary/40 transition-colors reveal" style={{ transitionDelay: `${i * 80}ms` }}>
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center mb-10 reveal">
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
          <div className="flex flex-col items-center gap-3">
            <img
              src={garantiaBadge}
              alt="Selo 7 dias de garantia — satisfação garantida 100%"
              loading="lazy"
              decoding="async"
              width="180"
              height="180"
              className="h-32 w-32 md:h-40 md:w-40 object-contain"
            />
            <span className="text-sm font-semibold text-foreground">Garantia incondicional de 7 dias</span>
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

      <BeatCarouselDialog
        beats={beats}
        openIndex={openBeatIndex}
        onClose={() => { setOpenBeatIndex(null); pauseCurrent(); }}
        meta={BEAT_META}
      />

      <AlertDialog open={showUpsell} onOpenChange={setShowUpsell}>
        <AlertDialogContent className="border-2 max-w-md" style={{ borderImage: "linear-gradient(135deg, #c98b1a, #ffd86b, #fff5b8, #ffd86b, #c98b1a) 1", background: "linear-gradient(180deg, #14100a 0%, #0a0805 100%)" }}>
          <button
            onClick={() => setShowUpsell(false)}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition z-10"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <span className="supreme-badge">
                <Star className="h-3 w-3 fill-current" />
                <span>Espera!</span>
                <Star className="h-3 w-3 fill-current" />
              </span>
            </div>
            <AlertDialogTitle className="text-center text-2xl md:text-3xl font-black">
              <span className="supreme-title">Você viu o Pack Supremo?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[#d9c98e] text-base pt-2">
              Antes de fechar, dá uma olhada na <strong className="text-[#ffd86b]">Oferta Suprema</strong>:
              <br />
              <span className="text-white">+200 beats VIP, stems, drum kit e curso bônus</span>
              <br />
              por apenas <strong className="text-[#ffd86b]">R$ 47,90</strong> — economia de 75%.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              onClick={handleGoSupreme}
              className="supreme-cta inline-flex items-center justify-center w-full"
            >
              <span className="supreme-cta-shine" aria-hidden="true" />
              <Trophy className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">VER PACK SUPREMO</span>
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={handleContinueBasic}
              className="w-full mt-0 h-12 bg-green-600 hover:bg-green-500 border-green-500 text-white text-base font-bold shadow-lg"
            >
              Não, prefiro o pack básico de R$ 19,90
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={deliveryModal.open} onOpenChange={(open) => setDeliveryModal((s) => ({ ...s, open }))}>
        {(() => {
          const isGold = deliveryModal.variant === "gold";
          const accent = isGold ? "#ffd86b" : "#22c55e";
          const accentSoft = isGold ? "#d9c98e" : "#86efac";
          const btnBg = isGold
            ? "linear-gradient(135deg, #c98b1a, #ffd86b, #fff5b8, #ffd86b, #c98b1a)"
            : "linear-gradient(135deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a)";
          const btnColor = isGold ? "#1a1208" : "#03140a";
          const borderImg = isGold
            ? "linear-gradient(135deg, #c98b1a, #ffd86b, #fff5b8, #ffd86b, #c98b1a) 1"
            : "linear-gradient(135deg, #14532d, #22c55e, #4ade80, #22c55e, #14532d) 1";
          return (
            <DialogContent
              className="max-w-[400px] p-0 overflow-hidden border-2 gap-0"
              style={{
                borderImage: borderImg,
                background: "linear-gradient(180deg, #0d0d0d 0%, #050505 100%)",
              }}
            >
              <div className="px-6 pt-7 pb-5 text-center">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-center text-xl md:text-[22px] font-black leading-tight text-white">
                    Confirme seu WhatsApp e e-mail no checkout
                  </DialogTitle>
                  <DialogDescription className="text-center text-sm leading-relaxed" style={{ color: accentSoft }}>
                    A entrega é <strong style={{ color: accent }}>automática e instantânea</strong>. Se os dados estiverem errados, você não recebe o pack.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 pb-6 space-y-2">
                <Button
                  onClick={() => {
                    const url = deliveryModal.url;
                    setDeliveryModal({ open: false, url: "", variant: "green" });
                    executeCheckout(url);
                  }}
                  className="w-full h-12 text-base font-black shadow-lg border-0"
                  style={{ background: btnBg, color: btnColor }}
                  aria-label="Continuar para o pagamento"
                >
                  Continuar para o pagamento →
                </Button>
                <button
                  type="button"
                  onClick={() => setDeliveryModal({ open: false, url: "", variant: "green" })}
                  className="w-full text-xs text-[#777] hover:text-white transition py-1"
                  aria-label="Voltar"
                >
                  Voltar
                </button>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}

function BeatCarouselDialog({
  beats,
  openIndex,
  onClose,
  meta,
}: {
  beats: BeatItem[];
  openIndex: number | null;
  onClose: () => void;
  meta: { name: string; genre: string }[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, startIndex: openIndex ?? 0 });
  const [selected, setSelected] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex !== null && emblaApi) {
      emblaApi.scrollTo(openIndex, true);
      setSelected(openIndex);
    }
  }, [openIndex, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      pauseCurrent();
    };
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const open = openIndex !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="beat-dialog-overlay fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <DialogPrimitive.Content className="beat-dialog-content pointer-events-auto relative w-full max-w-md">
            <DialogTitle className="sr-only">Beats</DialogTitle>
            <div className="overflow-hidden rounded-lg" ref={emblaRef}>
              <div className="flex">
                {beats.map((b, i) => {
                  const m = meta[i] || { name: b.name, genre: "TRAP" };
                  return (
                    <div key={`${b.name}-${i}`} className="flex-[0_0_100%] min-w-0 px-1">
                      <BeatSlide beat={b} name={b.name || m.name} active={selected === i} />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Anterior"
              className="absolute left-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Próximo"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <DialogPrimitive.Close className="absolute right-2 top-2 rounded-full opacity-90 hover:opacity-100 transition bg-black/60 p-1.5 z-10">
              <X className="h-4 w-4 text-white" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>

            <div className="mt-3 flex justify-center gap-1.5">
              {beats.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Ir ao beat ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${selected === i ? "w-5 bg-primary" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}

function BeatSlide({ beat, name, active }: { beat: BeatItem; name: string; active: boolean }) {
  const [resolvedUrl, setResolvedUrl] = useState("");
  const snap = useBeatSnap();
  useEffect(() => { setResolvedUrl(normalizeDirectUrl(beat.url)); }, [beat.url]);

  useEffect(() => {
    if (!active) return;
  }, [active]);

  const isActive = snap.activeUrl === resolvedUrl;
  const isPlaying = isActive && snap.isPlaying;
  const isLoading = snap.loadingUrl === resolvedUrl && !snap.isPlaying;
  const bgImage = beat.image_url || null;

  const toggle = () => {
    if (!resolvedUrl) return;
    if (isPlaying) { pauseCurrent(); return; }
    playUrl(resolvedUrl);
  };

  return (
    <div
      className="relative w-full aspect-square flex flex-col justify-between p-5 rounded-lg overflow-hidden border border-border"
      style={{
        background: bgImage
          ? `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%), url("${bgImage}") center/cover no-repeat`
          : "#111111",
      }}
    >
      <div
        className="text-center text-white self-center text-sm md:text-lg"
        style={{
          fontWeight: 700,
          textTransform: "uppercase",
          background: "rgba(0,0,0,0.5)",
          padding: "6px 12px",
          borderRadius: 6,
        }}
      >
        {name}
      </div>

      <div className="flex justify-center">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pausar" : "Tocar"}
          disabled={!resolvedUrl}
          className={`h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-glow)] hover:brightness-110 transition disabled:opacity-60 ${isPlaying ? "beat-pulse" : ""}`}
        >
          {isPlaying ? (
            <PauseIcon className="h-9 w-9 fill-current" />
          ) : isLoading ? (
            <Loader2 className="h-9 w-9 animate-spin" />
          ) : (
            <PlayIcon className="h-9 w-9 fill-current ml-1" />
          )}
        </button>
      </div>

      {(beat.bpm || beat.key) && (
        <div
          className="text-center self-center text-white"
          style={{ fontSize: 12, background: "rgba(0,0,0,0.45)", padding: "4px 10px", borderRadius: 4 }}
        >
          {beat.bpm && <span style={{ fontWeight: 700 }}>{beat.bpm} BPM</span>}
          {beat.bpm && beat.key && <span style={{ margin: "0 6px", opacity: 0.7 }}>·</span>}
          {beat.key && <span>{beat.key}</span>}
        </div>
      )}
    </div>
  );
}
