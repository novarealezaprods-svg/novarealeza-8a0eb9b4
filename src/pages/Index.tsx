import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User, Skull, Trophy, Music, Globe, Zap, Lock, ShieldCheck as Shield, MessageCircle, AlertTriangle } from "lucide-react";
import { ListMusic, ExternalLink } from "lucide-react";
import { BeatPlayer, type BeatItem, playUrl, pauseCurrent, useBeatSnap } from "@/components/BeatPlayer";
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
import garantia7Dias from "@/assets/garantia-7-dias.png";

const genres = ["BOOMBAP/RAP", "FUNK", "NEW JAZZ", "Hard", "Sampled", "R&B", "Drill", "EXPERIMENTAL"];
const features = [
  "100 beats profissionais prontos para uso",
  "40 beats funk",
  "40 beats trap",
  "20 beats variados (boombap, edm, drill, new jazz)",
  "100% royalty free — você fica com tudo",
  "Liberado para Spotify, YouTube, TikTok",
  "Mixados e masterizados em alta qualidade",
];
const packFeatures = [
  "100 beats profissionais (40 Funk · 40 Trap · 20 Variados)",
  "Liberado para todas plataformas digitais",
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
  { q: "Como recebo o pack?", a: "Após a compra, você recebe acesso imediato ao link de download por e-mail e whatsapp." },
  { q: "Tem garantia?", a: "Sim, 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro." },
];

const BEAT_META: { name: string; genre: string }[] = [
  { name: "Type Trap", genre: "FUNK" },
  { name: "Type Trap", genre: "FUNK" },
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
  const [checkoutUrlUpsell, setCheckoutUrlUpsell] = useState<string>("");
  const [openBeatIndex, setOpenBeatIndex] = useState<number | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; url: string; variant: "green" | "gold" }>({ open: false, url: "", variant: "green" });
  const [playlists, setPlaylists] = useState<{ id: string; name: string; url: string }[]>([]);

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
      const [{ data: settings }, { data: imgs }, { data: bts }, { data: pls }] = await Promise.all([
        supabase.from("site_settings").select("key,value"),
        supabase.from("proof_images").select("url").order("position", { ascending: true }),
        supabase.from("beats").select("name,url,key,bpm,image_url,genre,active").eq("active", true).order("position", { ascending: true }),
        supabase.from("playlists" as any).select("id,name,url").order("position", { ascending: true }),
      ]);
      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      setPreviewVideo(map["preview_video"] ?? null);
      setCheckoutUrl(map["checkout_url"] ?? "");
      setCheckoutUrlSupreme(map["checkout_url_supreme"] ?? "");
      setCheckoutUrlUpsell(map["checkout_url_upsell"] ?? "");
      setProofImages(
        (imgs ?? []).map((r: any) =>
          String(r.url).replace(/([?&])dl=1\b/, "$1raw=1")
        )
      );
      setBeats((bts ?? []) as BeatItem[]);
      setPlaylists((pls ?? []) as any);
    })();
  }, []);

  const handleCheckout = (urlOverride?: string, _variant: "green" | "gold" = "green") => {
    const target = urlOverride || checkoutUrl;
    if (!target) return;
    executeCheckout(target);
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
      <section className="hero-section relative overflow-hidden pt-16 pb-6 md:pt-8 md:pb-8" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className={`${CONTAINER} text-center flex flex-col items-center gap-4`}>
          <h1 className="hero-title font-black tracking-tight leading-[0.95] text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-center mx-auto px-6 md:px-0">
            Pare de Enterrar Sua Música
            <br />
            em Beat <span className="text-accent">FREE</span>
          </h1>

          <p className="hero-fade hero-subtitle mx-auto max-w-xl leading-relaxed tracking-wide text-center text-white/70 text-[16px]" style={{ animationDelay: "200ms" }}>
            Tenha 300 Beats Profissionais por menos<br />que um lanche. Grave e poste hoje.
          </p>

          <div className="mx-auto w-full max-w-[560px] md:max-w-[720px]">
            <Card className="relative aspect-video overflow-hidden border-0 bg-transparent shadow-none rounded-none group">
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

          <div className="flex items-center justify-center gap-1.5 text-[11px] md:text-xs font-medium text-white/80 text-center px-4" style={{ marginTop: "-4px" }}>
            <Check className="h-3 w-3 text-[#5dff8a] flex-shrink-0" style={{ filter: "drop-shadow(0 0 4px rgba(0,255,95,0.6))" }} />
            <span>
              <span className="font-black text-[#5dff8a]" style={{ textShadow: "0 0 8px rgba(0,255,95,0.5)" }}>Uso liberado</span>{" "}
              pra Spotify, Instagram, TikTok etc
            </span>
          </div>

          <div className="hero-cta-block flex flex-col items-center w-full" style={{ marginTop: 0 }}>
            <button
              onClick={() => document.getElementById("pack-basico")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="hero-cta inline-flex items-center justify-center whitespace-nowrap"
            >
              <span className="hero-cta-shine" aria-hidden="true" />
              <span className="hero-cta-text">QUERO GARANTIR MEU PACK</span>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("ouca-antes")?.scrollIntoView({ behavior: "smooth" })}
              className="group mt-4 flex flex-col items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
            >
              <span
                className="text-[15px] font-semibold text-white group-hover:text-white transition-opacity duration-200 no-underline tracking-wide"
                style={{ animation: "hook-pulse 1.6s ease-in-out infinite" }}
              >
                Ouça antes de comprar
              </span>
              <ChevronDown
                className="h-5 w-5 text-white group-hover:text-white transition-opacity duration-200"
                style={{ animation: "hook-bounce 1.2s ease-in-out infinite" }}
              />
              <style>{`@keyframes hook-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } } @keyframes hook-pulse { 0%,100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.06); opacity: 1; } }`}</style>
            </button>
          </div>

        </div>
      </section>

      <section id="ouca-antes" className="py-6 md:py-8 border-t border-border/50 scroll-mt-20">
        <div className={CONTAINER}>
          <div className="text-center mb-12 reveal">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Ouça Antes de Comprar
            </h2>
            <div className="mx-auto mt-6 h-[3px] w-20 bg-accent rounded-full" />
            <p className="mt-4 text-[15px]" style={{ color: "#888" }}>
              Ouça alguns beats do pack — Trap, Funk, Boombap, Drill, Hood, Reggaeton e muito mais
            </p>
          </div>

          {beats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 max-w-5xl mx-auto">
              {beats.slice(0, 12).map((b: any, i) => {
                const fallback = BEAT_META[i] || { name: b.name, genre: "FUNK" };
                const meta = {
                  name: b.name || fallback.name,
                  genre: b.genre || fallback.genre,
                };
                return (
                  <BeatPlayer
                    key={`${b.name}-${i}`}
                    beat={b}
                    index={i}
                    displayName={meta.name}
                    genre={meta.genre}
                    onOpen={(idx) => setOpenBeatIndex(idx)}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="p-10 border-dashed border-border/60 bg-card/40 text-center max-w-4xl mx-auto">
              <Music2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum beat enviado ainda.</p>
            </Card>
          )}

          {playlists.length > 0 && (
            <div className="mt-12 max-w-5xl mx-auto reveal">
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white inline-flex items-center gap-2">
                  <ListMusic className="w-6 h-6 text-primary" />
                  Playlists
                </h3>
                <div className="mx-auto mt-3 h-[3px] w-16 bg-accent rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {playlists.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                        <ListMusic className="w-4 h-4" />
                      </span>
                      <span className="font-medium text-sm text-white truncate">{p.name}</span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 reveal">
            {genres.map((g, i) => (
              <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 text-xs tracking-wider uppercase">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/30">
        <div className={`${CONTAINER} py-6 md:py-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center`}>
          {stats.map((s) => (
            <div key={s.id}>
              <div className="text-2xl md:text-3xl font-black">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="avaliacoes" className="py-6 md:py-8 bg-card/30 border-y border-border/50 scroll-mt-20">
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

      <section className="py-6 md:py-8 bg-background border-t border-border/50">
        <div className={CONTAINER}>
          {/* BLOCO — Dor (acima do Antes vs Depois) */}
          <div className="max-w-3xl mx-auto mb-14 md:mb-20 reveal">
            <div
              className="rounded-2xl p-6 md:p-10 border border-destructive/40 bg-[#0a0a0a] relative overflow-hidden text-center"
              style={{ boxShadow: "0 10px 40px -10px hsl(var(--destructive) / 0.35)" }}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-destructive" />
              <div className="flex flex-col items-center gap-3 mb-6">
                <span className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/15 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30">
                  A verdade que ninguém te conta
                </span>
              </div>

              <h3 className="text-3xl md:text-4xl font-black text-white leading-[1.15]">
                Beat ruim não é só "som fraco".
                <br />
                <span className="text-destructive">É a sua carreira travada antes de começar.</span>
              </h3>

              <p className="mt-6 text-[17px] md:text-xl text-[#dcdcdc] leading-relaxed max-w-2xl mx-auto">
                Enquanto você posta com beat free que <span className="text-white font-semibold">todo mundo já usou</span>, o ouvinte pula em 3 segundos. Sua música não registra nas plataformas, não roda no Spotify, não monetiza no YouTube — e pior: pode <span className="text-white font-semibold">cair do ar a qualquer momento</span> por direitos autorais.
              </p>

              <ul className="mt-8 flex flex-col items-center max-w-xl mx-auto" style={{ gap: "16px" }}>
                {[
                  "Som genérico que qualquer um já usou — você vira mais um na multidão",
                  "Sem registro nas plataformas, sua música não conta como sua",
                  "Lançamento inseguro: hoje no ar, amanhã derrubado por copyright",
                  "Sem saber se vai bombar ou sumir em 24h",
                  "Cada post com beat free é uma chance perdida de crescer",
                ].map((t, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 font-medium leading-snug text-left"
                    style={{ fontSize: "17px", color: "#e6e6e6" }}
                  >
                    <span className="text-destructive font-bold flex-shrink-0 mt-0.5">⚠</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-lg md:text-xl font-black text-white">
                Quantos lançamentos você já <span className="text-destructive">queimou</span> assim?
              </p>
            </div>
          </div>

          {/* BLOCO 1 — Antes vs Depois */}
          <div className="text-center mb-14 reveal">
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
              className="ba-card left rounded-lg p-6 md:p-8 border-l-4 border-l-destructive bg-[#0a0a0a] reveal reveal-left"
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
                  "Direitos autorais bloqueando seu som",
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
              className="ba-card right rounded-lg p-6 md:p-8 border-l-4 border-l-primary bg-[#0a0a0a] reveal reveal-right"
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
                  "BOOMBAP/RAP, FUNK, R&B, NEW JAZZ e muito mais",
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

          {/* BLOCO — Entrega do produto */}
          <div className="mt-12 md:mt-16 max-w-3xl mx-auto reveal">
            <div
              className="rounded-2xl p-6 md:p-8 border border-primary/30 bg-[#0a0a0a] text-center"
              style={{ boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.25)" }}
            >
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
                <Zap className="h-3 w-3" />
                Entrega imediata
              </span>
              <h3 className="mt-4 text-2xl md:text-3xl font-black text-white leading-tight">
                Como você vai receber seus beats
              </h3>
              <p className="mt-3 text-sm md:text-base text-[#aaaaaa] max-w-xl mx-auto">
                Logo após a confirmação do pagamento, você recebe o acesso completo direto no seu <span className="text-white font-semibold">WhatsApp</span> e no seu <span className="text-white font-semibold">Gmail</span>. Sem espera, sem complicação.
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="flex items-center gap-3 rounded-xl p-4 border border-border/60 bg-background/40">
                  <span className="flex items-center justify-center h-11 w-11 rounded-full bg-primary/15 text-primary flex-shrink-0">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">WhatsApp</div>
                    <div className="text-xs text-[#9ad9a4]">Link enviado na hora</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl p-4 border border-border/60 bg-background/40">
                  <span className="flex items-center justify-center h-11 w-11 rounded-full bg-primary/15 text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">Gmail</div>
                    <div className="text-xs text-[#9ad9a4]">Acesso vitalício no e-mail</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Garantia Incondicional 7 dias */}
          <div className="mt-16 md:mt-20 max-w-3xl mx-auto reveal">
            <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/50 bg-gradient-to-br from-[#1a1408] via-card/80 to-[#1a1408] p-6 md:p-10 shadow-[0_0_60px_-15px_rgba(212,175,55,0.4)]">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
              <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
                <img
                  src={garantia7Dias}
                  alt="Selo dourado de garantia de 7 dias - satisfação garantida ou seu dinheiro de volta"
                  className="w-36 h-36 md:w-44 md:h-44 flex-shrink-0 drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]"
                  loading="lazy"
                />
                <div className="flex-1 flex flex-col items-center md:items-start gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f0d78c] text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Risco zero
                  </span>
                  <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                    Garantia Incondicional de <span className="text-[#f0d78c]">7 Dias</span>
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground max-w-lg">
                    Sua compra é <span className="text-white font-semibold">100% protegida</span>. Se em até 7 dias você não ficar satisfeito com a qualidade dos beats, devolvemos <span className="text-white font-semibold">todo o seu dinheiro</span> — sem perguntas, sem burocracia. O risco é todo nosso.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO 2 — Cards de Compra (Pack 100 + Pack 300 lado a lado) */}
          <div id="pack-basico" className="mt-12 md:mt-16 flex flex-col gap-6 max-w-2xl mx-auto items-stretch scroll-mt-20">
            <div className="basic-card reveal reveal-zoom">
              <div className="basic-card-inner text-center">
                <span className="basic-badge">
                  <Flame className="h-3 w-3" />
                  <span>Oferta limitada</span>
                </span>
                <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight">
                  <span className="basic-title">Pack 100 Beats</span>
                </h2>
                <p className="mt-2 text-sm md:text-base text-[#9ad9a4] font-semibold tracking-wide">
                  Pagamento único · Acesso vitalício
                </p>

                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="basic-price text-5xl md:text-6xl font-black leading-none">
                    R$ 19,90
                  </span>
                </div>

                <div className="mt-8 text-left max-w-md mx-auto flex flex-col" style={{ gap: "6px" }}>
                  {packFeatures.map((f, i) => (
                    <div key={i} className="basic-feature" style={{ fontSize: "13px" }}>
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
                    className="hero-cta basic-cta inline-flex items-center justify-center whitespace-nowrap"
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

            {/* Transição dourada para apresentar o Pack 300 */}
            <div className="text-center reveal reveal-zoom py-2">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                <span className="supreme-title">Seja Um Artista Completo</span>
              </h2>
            </div>

            {/* Pack 300 — destaque verde */}
            <div
              id="oferta-suprema"
              className="reveal reveal-zoom relative scroll-mt-20 rounded-2xl"
              style={{
                border: "2px solid rgba(255, 196, 0, 0.55)",
                boxShadow:
                  "0 0 24px rgba(255, 196, 0, 0.35), 0 0 60px rgba(255, 196, 0, 0.15), inset 0 0 18px rgba(255, 196, 0, 0.08)",
              }}
            >
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
                  <span className="supreme-strike">R$ 137,00</span>
                  <span className="supreme-price text-5xl md:text-6xl font-black leading-none">
                    R$ 37,90
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
                    "TODOS estilos musicais (Trap - Funk - R&B - Drill - Hard - Boombap - Hood - Reggaeton)",
                    "100% Royalty Free — Spotify, YouTube, TikTok",
                    "Bônus 1: Drum kit profissional (808, kicks, hats...)",
                    "Bônus 2: Presets De Mixagem",
                    "Bônus 3: Acesso a comunidade do Whatsapp com artistas de todo Brasil",
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
                  className="mt-4 rounded-xl px-4 py-3 max-w-md mx-auto"
                  style={{
                    background: "rgba(255, 196, 0, 0.08)",
                    border: "1px solid rgba(255, 196, 0, 0.28)",
                  }}
                >
                  <p className="text-sm md:text-base font-semibold text-[#fff8e0] flex items-center justify-center gap-2 flex-wrap">
                    <Flame className="h-4 w-4 text-[#ffd86b]" />
                    <span className="font-black text-[#ffd86b]" style={{ textShadow: "0 0 10px rgba(255, 215, 0, 0.5)" }}>
                      +2.500
                    </span>
                    <span>artistas já garantiram o pack</span>
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-center w-full">
                  <button
                    onClick={() => handleCheckout(checkoutUrlSupreme || checkoutUrl, "gold")}
                    className="supreme-cta inline-flex items-center justify-center"
                  >
                    <span className="supreme-cta-shine" aria-hidden="true" />
                    <Download className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">300 BEATS POR 37,90</span>
                  </button>
                </div>
                <p className="mt-4 text-xs text-[#d9c98e] flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Garantia incondicional de 7 dias · Pagamento 100% seguro</span>
                </p>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8 border-t border-border/50">
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

      <footer className="relative mt-8 overflow-hidden border-t border-border/50 bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        

        <div className={`${CONTAINER} relative py-14`}>
          {/* Brand row */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold tracking-tight text-foreground">Nova Realeza</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Beats profissionais para artistas que querem soltar hits de verdade.
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-2.5 text-sm">
              <Shield className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Garantia de 7 dias</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-2.5 text-sm">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-2.5 text-sm">
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Acesso imediato</span>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-10">
            <a
              href="mailto:novarealezaprods@gmail.com"
              className="group flex items-center gap-2 text-sm text-foreground/90 transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4 text-primary" />
              <span className="font-medium">novarealezaprods@gmail.com</span>
            </a>
            <a
              href="https://wa.me/5511978768141"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm text-foreground/90 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary" />
              <span className="font-medium">(11) 97876-8141</span>
            </a>
          </div>

          {/* Divider */}
          <div className="mx-auto mt-10 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Legal */}
          <div className="mt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground sm:flex-row sm:justify-center sm:gap-6">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>Cléber Marques Ernanandes</span>
            </div>
            <div className="hidden h-3 w-px bg-border sm:block" />
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>CNPJ 51.800.800/0001-28</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground/70">
            {`© ${new Date().getFullYear()} Nova Realeza. Todos os direitos reservados.`}
          </p>
        </div>
      </footer>

      <BeatCarouselDialog
        beats={beats.slice(0, 12)}
        openIndex={openBeatIndex}
        onClose={() => { setOpenBeatIndex(null); pauseCurrent(); }}
        meta={BEAT_META}
      />

      {showUpsell && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowUpsell(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[400px] animate-in slide-in-from-bottom-8 duration-500"
            style={{
              background: "#0d0d0d",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(0,255,65,0.4)",
              boxShadow: "0 0 20px rgba(0,255,65,0.3)",
            }}
          >
            <div className="flex justify-center mb-3">
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black tracking-wide"
                style={{ background: "#FF3C3C", color: "#fff" }}
              >
                🔥 OFERTA ESPECIAL
              </span>
            </div>
            <h3 className="text-center font-bold text-white" style={{ fontSize: "18px" }}>
              Espera! Antes de continuar...
            </h3>
            <p
              className="text-center mt-2 text-white"
              style={{ fontSize: "13px", opacity: 0.7, lineHeight: 1.5 }}
            >
              Adicione +200 beats ao seu pack por apenas R$18,00 a mais!
            </p>

            <div className="mt-5 flex flex-col items-center gap-1">
              <span style={{ color: "#555", fontSize: "14px", textDecoration: "line-through" }}>
                De R$ 37,90
              </span>
              <span
                style={{
                  color: "#00FF41",
                  fontWeight: 800,
                  fontSize: "32px",
                  lineHeight: 1,
                  textShadow: "0 0 12px rgba(0,255,65,0.5)",
                }}
              >
                R$ 27,90
              </span>
              <span
                className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(0,255,65,0.12)",
                  color: "#00FF41",
                  fontSize: "12px",
                  border: "1px solid rgba(0,255,65,0.35)",
                }}
              >
                💰 Você economiza R$20,00
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowUpsell(false);
                  executeCheckout(checkoutUrlUpsell || checkoutUrlSupreme || checkoutUrl);
                }}
                className="w-full rounded-xl font-black transition hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #00C853, #00FF41)",
                  color: "#03140a",
                  padding: "14px 16px",
                  fontSize: "14px",
                  boxShadow: "0 0 18px rgba(0,255,65,0.45)",
                }}
              >
                SIM! QUERO O PACK 300 POR R$27,90
              </button>
              <button
                onClick={() => {
                  setShowUpsell(false);
                  executeCheckout(checkoutUrl);
                }}
                className="w-full bg-transparent border-0 hover:text-white transition"
                style={{ color: "#555", fontSize: "12px" }}
              >
                Não, quero apenas o Pack 100
              </button>
            </div>
          </div>
        </div>
      )}

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
