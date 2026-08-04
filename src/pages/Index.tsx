import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Flame, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User, Skull, Trophy, Music, Globe, Zap, Lock, ShieldCheck as Shield, MessageCircle, AlertTriangle, FileCheck, Heart } from "lucide-react";
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
import { ScarcityBar } from "@/components/ScarcityBar";
import garantia7Dias from "@/assets/garantia-7-dias.png";
import licencaAssinada from "@/assets/licenca-assinada.webp";
import mockup100Trap from "@/assets/mockup-100-trap.webp";

const genres = ["TRAP", "HARD", "DRILL", "HOOD", "AMBIENT", "CRANK", "NEW JAZZ", "BOUNCE"];
const features = [
  "120 beats de trap profissionais prontos para uso",
  "Type Leviano, Fab Godamn, Alee, Tchelo e mais",
  "Trap, drill e variações",
  "100% royalty free — você fica com tudo",
  "Liberado para Spotify, YouTube, TikTok",
  "Mixados e masterizados em alta qualidade",
];
const packFeatures = [
  "120 beats de trap profissionais",
  "Liberado para todas plataformas digitais",
  "Mixados e masterizados em alta qualidade",
];
const testimonials = [
  { name: "MC Vinny", text: "Lancei 3 sons em 1 semana com o pack. Qualidade absurda.", role: "Artista independente" },
  { name: "Lucas Prod", text: "Os stems salvaram minha vida. Consigo customizar tudo.", role: "Beatmaker" },
  { name: "Maya", text: "Variedade insana de levada. Vale cada centavo.", role: "Cantora" },
];
const stats = [
  { id: "stat-3", n: "100%", l: "dos direitos pro artista" },
  { id: "stat-4", n: "100%", l: "Royalty free" },
];
const faq = [
  { q: "Posso usar os beats no Spotify e YouTube?", a: "Sim! Todos os beats são 100% royalty free. Você pode monetizar onde quiser." },
  { q: "Como recebo o pack?", a: "Após a compra, você recebe acesso imediato ao link de download por e-mail e whatsapp." },
  { q: "Tem garantia?", a: "Sim, 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro." },
];

// Visualizers de fundo, casados pelo nome do beat (sem acento, sem
// diferenciar maiuscula/minuscula). Os videos ficam em public/visualizers/,
// baixados e convertidos previamente — o site nao embute player de terceiros.
// Para adicionar: converta o video, jogue na pasta e acrescente uma linha.
const VISUALIZERS: Record<string, string> = {
  "type trap": "/visualizers/type-trap.mp4",
  "type alee": "/visualizers/type-alee.mp4",
  "type leviano": "/visualizers/type-leviano.mp4",
  "type supernova": "/visualizers/type-supernova.mp4",
  "types usa": "/visualizers/type-usa.mp4",
  "type fug": "/visualizers/type-fug.mp4",
  "type plugg": "/visualizers/type-plugg.mp4",
  "type bounce": "/visualizers/type-bounce.mp4",
  "type drill": "/visualizers/type-drill.mp4",
  "type florida": "/visualizers/type-florida.mp4",
};

// Normaliza o nome vindo do banco para casar com as chaves acima:
// tira acentos, remove apostrofos (o admin usa "TYPE\u00b4S USA", com acento
// agudo solto) e reduz qualquer outro separador a um espaco simples.
function visualizerFor(name: string): string | null {
  const key = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019\u2018\u00b4`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return VISUALIZERS[key] ?? null;
}

const BEAT_META: { name: string; genre: string }[] = [
  { name: "TRAP 🇺🇸", genre: "TRAP" },
  { name: "TRAP 🇺🇸", genre: "TRAP" },
  { name: "Type Alee", genre: "TYPE ALEE" },
  { name: "Type Leviano", genre: "TYPE LEVIANO" },
  { name: "Type Hood Drill", genre: "DRILL" },
  { name: "Type Fab Godamn", genre: "TYPE FAB GODAMN" },
  { name: "Type Tchelo", genre: "TYPE TCHELO" },
  { name: "Type Don Toliver", genre: "TRAP" },
  { name: "Type Skrilla", genre: "TRAP" },
  { name: "Type Florida", genre: "TRAP" },
];

export default function IndexPage() {
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [openBeatIndex, setOpenBeatIndex] = useState<number | null>(null);
  const [playlists, setPlaylists] = useState<{ id: string; name: string; url: string }[]>([]);
  const [showStickyCta, setShowStickyCta] = useState(false);

  const CONTAINER = "mx-auto w-full max-w-[1400px] px-6 md:px-10";

  useEffect(() => {
    // Garante que o site sempre inicia no topo (evita scroll restoration do navegador)
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  }, []);

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
        supabase.from("site_settings").select("key,value").neq("key", "preview_video"),
        supabase.from("proof_images").select("url").order("position", { ascending: true }),
        supabase.from("beats").select("name,url,key,bpm,image_url,genre,active").eq("active", true).order("position", { ascending: true }),
        supabase.from("playlists" as any).select("id,name,url").order("position", { ascending: true }),
      ]);
      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      setCheckoutUrl(map["checkout_url"] ?? "");
      setProofImages(
        (imgs ?? []).map((r: any) =>
          String(r.url).replace(/([?&])dl=1\b/, "$1raw=1")
        )
      );
      setBeats((bts ?? []) as BeatItem[]);
      setPlaylists((pls ?? []) as any);
    })();
  }, []);

  const handleCheckout =(urlOverride?: string, _variant: "green" | "gold" = "green") => {
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

  useEffect(() => {
    const beatsSection = document.getElementById("ouca-antes");
    const pricingSection = document.getElementById("pack-basico");
    if (!beatsSection || !pricingSection) return;

    let passedBeats = false;
    let pricingVisible = false;
    const update = () => setShowStickyCta(passedBeats && !pricingVisible);

    const beatsObserver = new IntersectionObserver(
      ([entry]) => {
        passedBeats = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      },
      { threshold: 0 }
    );
    const pricingObserver = new IntersectionObserver(
      ([entry]) => {
        pricingVisible = entry.isIntersecting;
        update();
      },
      { threshold: 0 }
    );

    beatsObserver.observe(beatsSection);
    pricingObserver.observe(pricingSection);
    return () => {
      beatsObserver.disconnect();
      pricingObserver.disconnect();
    };
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
            120 Beats Profissionais de Trap por R$ 19,90.<br />Grave e poste hoje.
          </p>

          <div className="mx-auto w-full max-w-[380px] md:max-w-[440px]">
            <img
              src={mockup100Trap}
              alt="Pack 120 Beats de Trap — Nova Realeza"
              className="w-full h-auto"
              width="900"
              height="900"
              fetchPriority="high"
            />
            {/* Mesmo gancho de ancoragem do card de preço, reforçado já no topo */}
            <div className="mt-3 mx-auto max-w-[280px] rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                120 licenças avulsas custariam
              </p>
              <p className="text-lg font-black text-white leading-none">
                <span className="line-through decoration-destructive decoration-2 text-white/60">R$ 7.200</span>{" "}
                <span className="text-primary">R$ 19,90</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] md:text-xs font-medium text-white/80 text-center px-4">
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
              Ouça alguns beats do pack — no pack tem type beat de: LEVIANO, FAB GODAMN, ALEE, TCHELO, além de TRAP, DRILL e mais&nbsp;
            </p>
          </div>

          {beats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 max-w-5xl mx-auto">
              {beats.slice(0, 12).map((b: any, i) => {
                const fallback = BEAT_META[i] || { name: b.name, genre: "TRAP" };
                const meta = {
                  name: b.name || fallback.name,
                  genre: b.genre || fallback.genre,
                };
                return (
                  <BeatPlayer
                    key={`${b.name}-${i}`}
                    beat={{ ...b, visualizer_video: visualizerFor(meta.name) }}
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
        <div className={`${CONTAINER} py-6 md:py-8 grid grid-cols-2 gap-4 text-center`}>
          {stats.map((s) => (
            <div key={s.id}>
              <div className="text-2xl md:text-3xl font-black text-primary">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-primary/80 mt-1">{s.l}</div>
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

      {/* Prova de licença assinada */}
      <section className="py-10 md:py-14 bg-background border-t border-border/50">
        <div className={CONTAINER}>
            <div className="max-w-4xl mx-auto reveal">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                  <FileCheck className="w-3.5 h-3.5" />
                  100% Legal · Assinado no Gov.br
                </span>
                <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                  Sua Música Merece uma <span className="text-primary">Licença de Verdade</span>
                </h2>
                <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
                  Contrato de licença de uso de beat, assinado digitalmente via Gov.br — a prova real de que
                  sua música <span className="text-white font-semibold">pode ir pra todas as plataformas
                  digitais</span>: Spotify, YouTube, TikTok, Deezer, Apple Music e qualquer outra, sem risco
                  de bloqueio ou remoção por direitos autorais.
                </p>
              </div>
  
              <div className="relative mx-auto max-w-md md:max-w-lg">
                <div
                  className="absolute inset-0 bg-primary/40 blur-[90px] rounded-full scale-90 pointer-events-none"
                  aria-hidden="true"
                />
                <img
                  src={licencaAssinada}
                  alt="Contrato de licença de uso de beat da Nova Realeza, assinado digitalmente via Gov.br — dados pessoais borrados por segurança"
                  className="license-float relative w-full rounded-2xl border border-primary/40 shadow-[0_0_60px_-10px_rgba(0,255,95,0.5)]"
                  loading="lazy"
                  decoding="async"
                  width="1900"
                  height="2180"
                />
              </div>
            </div>
        </div>
      </section>

      <section className="py-6 md:py-8 bg-background border-t border-border/50">
        <div className={CONTAINER}>
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
                  "beats de identidade e original",
                  "100% royalty free — Spotify, YouTube, sem medo",
                  "Som que posiciona você como artista sério",
                  "Type LEVIANO, FAB GODAMN, ALEE, TCHELO e muito mais",
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

          {/* BLOCO 2 — Card de Compra (oferta única: 120 beats de trap) */}
          <div id="pack-basico" className="mt-12 md:mt-16 flex flex-col gap-6 max-w-2xl mx-auto items-stretch scroll-mt-20">
            <div className="text-center py-2">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                <span className="supreme-title">Seja Um Artista Completo</span>
              </h2>
            </div>

            {/* Oferta única — card dourado */}
            <div
              id="oferta-suprema"
              className="relative scroll-mt-20 rounded-2xl"
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
                  <span className="supreme-title">PACK 120 BEATS DE TRAP</span>
                </h3>
                <p className="mt-2 text-sm md:text-base text-[#d9c98e] font-semibold tracking-wide">
                  Pacote completo
                </p>

                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="supreme-strike">R$ 137,00</span>
                  <span className="supreme-price text-5xl md:text-6xl font-black leading-none">
                    R$ 19,90
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className="supreme-savings">
                    <Flame className="h-3 w-3" />
                    Economize 85% hoje
                  </span>
                </div>

                <div className="mt-8 space-y-3.5 text-left max-w-md mx-auto">
                  {[
                    "120 beats de trap profissionais",
                    "Mixados e masterizados em alta qualidade",
                    "100% Royalty Free — Spotify, YouTube, TikTok",
                    "Bônus 1: Curso de como gravar em casa com a melhor qualidade",
                    "Bônus 2: Presets De Mixagem (Bandlab e Fl Studio)",
                    "Bônus 3: Acesso a comunidade do Whatsapp com artistas de todo Brasil",
                    "🍀 Bônus 4: Sorteio — Produção completa (mix, master, beat exclusivo, capa e distribuição para todas as plataformas digitais)",
                  ].map((f, i) => {
                    const isBonus = f.includes("Bônus");
                    return (
                      <div key={i} className="supreme-feature">
                        {isBonus ? (
                          <span className="supreme-feature-gift" aria-hidden="true">
                            🎁
                          </span>
                        ) : (
                          <span className="supreme-feature-check">
                            <Check />
                          </span>
                        )}
                        <span>{f}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col items-center w-full">
                  <button
                    onClick={() => handleCheckout(checkoutUrl, "gold")}
                    className="supreme-cta inline-flex items-center justify-center"
                  >
                    <span className="supreme-cta-shine" aria-hidden="true" />
                    <Download className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">120 BEATS POR 19,90</span>
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
                  decoding="async"
                  width="176"
                  height="176"
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

        </div>
      </section>

      <section className="py-6 md:py-8 border-t border-border/50">
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

      <footer className="relative mt-8 overflow-hidden border-t border-border/50 bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        

        <div className={`${CONTAINER} relative py-12 md:py-14`}>
          {/* Faixa de garantias — primeira coisa que se vê no rodapé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-3 text-sm">
              <Shield className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Garantia de 7 dias</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-3 text-sm">
              <Lock className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.08] px-4 py-3 text-sm">
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-semibold text-primary">Acesso imediato</span>
            </div>
          </div>

          <div className="mx-auto mt-10 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Colunas: marca · contato · institucional */}
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 text-center md:text-left">
            {/* Marca */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <span className="text-lg font-black tracking-tight text-foreground">Nova Realeza</span>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Beats profissionais para artistas que querem soltar hits de verdade.
              </p>
            </div>

            {/* Contato */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">
                Contato
              </h4>
              <a
                href="https://wa.me/5511978768141"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground/90 transition-colors hover:text-primary"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">(11) 97876-8141</span>
              </a>
              <a
                href="mailto:novarealezaprods@gmail.com"
                className="flex items-center gap-2 text-sm text-foreground/90 transition-colors hover:text-primary break-all"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">novarealezaprods@gmail.com</span>
              </a>
            </div>

            {/* Institucional */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/70">
                Informações
              </h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0 text-primary" />
                <span>Cléber Marques Ernandes Filho</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span>CNPJ 51.800.800/0001-28</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>Licença assinada via Gov.br</span>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

          <p className="mt-6 text-center text-xs text-muted-foreground/70">
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

      {showStickyCta && (
        <div className="sticky-cta-bar">
          <button
            onClick={() => document.getElementById("pack-basico")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="sticky-cta-btn"
          >
            QUERO GARANTIR MEU PACK
          </button>
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

    </div>
  );
}
