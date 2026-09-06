import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Music2, Download, ShieldCheck, Star, Play, ChevronDown, Mail, Phone, Building2, User, Skull, Trophy, Zap, Lock, ShieldCheck as Shield, MessageCircle, FileCheck, ListMusic, ExternalLink } from "lucide-react";
import { BeatPlayer, type BeatItem, pauseCurrent } from "@/components/BeatPlayer";
import { normalizeDirectUrl } from "@/lib/normalize-url";
import { VideoPreview } from "@/components/VideoPreview";
import prova1 from "@/assets/proof-images/prova-1.webp";
import prova2 from "@/assets/proof-images/prova-2.webp";
import prova3 from "@/assets/proof-images/prova-3.webp";
import prova4 from "@/assets/proof-images/prova-4.webp";
import prova5 from "@/assets/proof-images/prova-5.webp";
import prova6 from "@/assets/proof-images/prova-6.webp";
import garantia7Dias from "@/assets/garantia-7-dias.webp";
import licencaAssinada from "@/assets/licenca-assinada.webp";
import logoNovaRealeza from "@/assets/logo-nova-realeza.webp";

// O carrossel de beats só abre ao clicar num card, então o Radix Dialog e o
// embla-carousel saem do bundle inicial e só são baixados quando necessário.
const BeatCarouselDialog = lazy(() => import("@/components/BeatCarouselDialog"));

// Teto de espera pelos pixels antes de sair para o checkout. O beacon do
// KawaiPay leva ~800ms medidos; 1,5s cobre 4G ruim sem travar a compra.
const CHECKOUT_BEACON_TIMEOUT_MS = 1500;

const genres = ["TRAP", "HARD", "DRILL", "HOOD", "PLUGG", "CRANK", "NEW JAZZ"];
const features = [
  "120 beats de trap profissionais prontos para uso",
  "Type Leviano, Fab Godamn, Alee, Tchelo e mais",
  "Trap, drill e variações",
  "100% royalty free — você fica com tudo",
  "Liberado para Spotify, YouTube, TikTok",
  "Mixados e masterizados em alta qualidade",
];
// Usado só no card de entrada (pack menor). O pack maior tem a própria lista,
// com os bônus, dentro do card dourado.
const packFeatures = [
  "50 beats de trap profissionais",
  "Liberado para todas plataformas digitais",
  "Mixados e masterizados em alta qualidade",
];
const testimonials = [
  { name: "MC Vinny", text: "Lancei 3 sons em 1 semana com o pack. Qualidade absurda.", role: "Artista independente" },
  { name: "Lucas Prod", text: "Os stems salvaram minha vida. Consigo customizar tudo.", role: "Beatmaker" },
  { name: "Maya", text: "Variedade insana de levada. Vale cada centavo.", role: "Cantora" },
];
const faq = [
  { q: "Posso usar os beats no Spotify e YouTube?", a: "Sim! Todos os beats são 100% royalty free. Você pode monetizar onde quiser." },
  { q: "Como recebo o pack?", a: "Após a compra, você recebe acesso imediato ao link de download por e-mail e whatsapp." },
  { q: "Tem garantia?", a: "Sim, 7 dias de garantia incondicional. Se não gostar, devolvemos seu dinheiro." },
];
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

// Provas mais recentes (WhatsApp/Instagram), recortadas pelo próprio
// produtor só no conteúdo da conversa — usadas na faixa de prova social
// logo acima do CTA de compra. Mesmas do site de funk (mesmo produtor).
// Prints reais de conversa, versionados aqui. Antes a secao "Avaliacoes do
// pack" so lia do Supabase; com o projeto fora do ar ela caia nos depoimentos
// genericos de exemplo, que sao bem mais fracos que a conversa real.
const PROOF_IMAGES: string[] = [prova1, prova2, prova3, prova4, prova5, prova6];

const NEW_PROOF_IMAGES: string[] = [prova1, prova3, prova5];

// Visualizers de fundo, casados pelo nome do beat (sem acento, sem
// diferenciar maiuscula/minuscula). Os videos ficam em public/visualizers/,
// baixados e convertidos previamente — o site nao embute player de terceiros.
// Para adicionar: converta o video, jogue na pasta e acrescente uma linha.
const VISUALIZERS: Record<string, string> = {
  "type trap": "/visualizers/type-trap.mp4",
  "type alee": "/visualizers/type-alee.mp4",
  "type leviano": "/visualizers/type-leviano.mp4",
  "type supernova": "/visualizers/type-supernova.mp4",
  "type usa": "/visualizers/type-usa.mp4",
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

// Previas locais, servidas pelo proprio site. Antes vinham do Storage do
// Supabase; quando o projeto saiu do ar a secao inteira virou "Nenhum beat
// enviado ainda". Os arquivos ficam em public/beats/ -- cortes de 60s
// nivelados a -14 LUFS para que um beat nao soe mais alto que o outro.
// BPM e tom vieram do nome dos masters originais.
const PREVIEW_BEATS: BeatItem[] = [
  { name: "Type Alee", url: "/beats/type-alee-3.mp3", image_url: "/beat-images/type-alee.webp" },
  { name: "Type Trap", url: "/beats/type-trap-2.mp3", image_url: "/beat-images/type-brandao.webp" },
  { name: "Type Leviano", url: "/beats/type-leviano.mp3", image_url: "/beat-images/type-leviano.webp" },
  { name: "Type Supernova", url: "/beats/type-supernova-2.mp3", image_url: "/beat-images/type-supernova.webp" },
  { name: "Type USA", url: "/beats/type-usa.mp3", image_url: "/beat-images/type-usa.webp" },
  { name: "Type Fug", url: "/beats/type-fug.mp3", image_url: "/beat-images/type-fug.webp" },
  { name: "Type Plugg", url: "/beats/type-plugg.mp3", image_url: "/beat-images/type-plugg.webp" },
];

// Mesma ordem de PREVIEW_BEATS. So alimenta o texto alternativo da capa,
// nao aparece na tela -- fora de ordem, geraria descricao errada.
const BEAT_META: { name: string; genre: string }[] = [
  { name: "Type Alee", genre: "TYPE ALEE" },
  { name: "Type Trap", genre: "TYPE TRAP" },
  { name: "Type Leviano", genre: "TYPE LEVIANO" },
  { name: "Type Supernova", genre: "TYPE SUPERNOVA" },
  { name: "Type USA", genre: "TRAP" },
  { name: "Type Fug", genre: "TYPE FUG" },
  { name: "Type Plugg", genre: "PLUGG" },
  { name: "Type Drill", genre: "DRILL" },
  { name: "Type Florida", genre: "TRAP" },
];

// Fallback da VSL: mesmo vídeo já hospedado no Supabase deste projeto.
// Serve de rede de segurança caso a linha "preview_video" em site_settings
// fique vazia — o vídeo real continua vindo do banco normalmente.
const VSL_URL_FALLBACK = "/videos/vsl-2.mp4";
const VSL_THUMBNAIL_FALLBACK = "/videos/vsl-poster-2.webp";

// Links de checkout de emergencia. O valor bom vem de site_settings, mas se o
// Supabase estiver fora do ar os states ficavam em "" e TODO botao de compra
// virava clique morto -- o site parava de vender sem dar nenhum sinal.
// Sao os mesmos valores cadastrados no banco: so entram quando ele falha.
const CHECKOUT_URL_FALLBACK = "https://app.kawaipay.com/checkout/10051"; // pack 50
const CHECKOUT_URL_SUPREME_FALLBACK = "https://app.kawaipay.com/checkout/10258"; // pack 120
const CHECKOUT_URL_UPSELL_FALLBACK = "https://app.kawaipay.com/checkout/10059?price=8b298a11-45a6-4697-bf9c-518fbb092c6b"; // promo R$27,90


export default function IndexPage() {
  const [previewVideo, setPreviewVideo] = useState<string | null>(VSL_URL_FALLBACK);
  const [vslThumbnail, setVslThumbnail] = useState<string | null>(VSL_THUMBNAIL_FALLBACK);
  const [proofImages, setProofImages] = useState<string[]>(PROOF_IMAGES);
  const [beats, setBeats] = useState<BeatItem[]>(PREVIEW_BEATS);
  const [checkoutUrl, setCheckoutUrl] = useState<string>(CHECKOUT_URL_FALLBACK);
  const [checkoutUrlSupreme, setCheckoutUrlSupreme] = useState<string>(CHECKOUT_URL_SUPREME_FALLBACK);
  const [checkoutUrlUpsell, setCheckoutUrlUpsell] = useState<string>(CHECKOUT_URL_UPSELL_FALLBACK);
  const [showUpsell, setShowUpsell] = useState(false);
  const [licenseZoomOpen, setLicenseZoomOpen] = useState(false);
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

  // Scroll reveal animations. Observer fica vivo o componente inteiro (nao
  // recria a cada fetch do Supabase) -- recriar no meio do carregamento
  // desconectava o observer antigo e podia deixar elementos travados em
  // opacity:0 pra sempre, mesmo ja tendo passado pela viewport.
  const revealObserverRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    if (!revealObserverRef.current) {
      revealObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              (e.target as HTMLElement).classList.add("is-visible");
              revealObserverRef.current?.unobserve(e.target);
            }
          });
        },
        // Dispara ANTES do card entrar na tela: a margem inferior positiva
        // estica a área de observação meia tela para baixo, então a transição
        // já terminou quando o card fica visível de fato. Com threshold 0.15 e
        // margem negativa, rolagem rápida mostrava o card ainda transparente.
        { threshold: 0, rootMargin: "0px 0px 50% 0px" }
      );
    }
    const io = revealObserverRef.current;
    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => io.observe(el));
  }, [beats.length, proofImages.length]);

  // Rede de segurança do reveal. Num flick rápido (ou scroll por âncora) o
  // elemento pode estar abaixo da área observada num frame e já acima da tela
  // no seguinte: como nunca chega a intersectar, o observer não dispara e ele
  // fica em opacity:0 pra sempre — é o "bloco preto" que aparecia nas prévias
  // e nos depoimentos. Esta varredura revela qualquer um que já passou pela
  // dobra e se desliga sozinha quando não sobra nenhum.
  useEffect(() => {
    let raf = 0;
    const varrer = () => {
      raf = 0;
      const vh = window.innerHeight;
      const restantes = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
      restantes.forEach((el) => {
        if (el.getBoundingClientRect().top < vh) {
          el.classList.add("is-visible");
          revealObserverRef.current?.unobserve(el);
        }
      });
      if (!document.querySelector(".reveal:not(.is-visible)")) desligar();
    };
    const agendar = () => {
      if (!raf) raf = requestAnimationFrame(varrer);
    };
    const desligar = () => {
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    };
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar, { passive: true });
    return () => {
      desligar();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [beats.length, proofImages.length]);

  useEffect(() => () => revealObserverRef.current?.disconnect(), []);

  // A VSL agora e arquivo estatico do proprio site (public/videos/vsl.mp4),
  // servido pelo Cloudflare junto com a pagina. Antes vinha do Supabase e a URL
  // ficava guardada em localStorage["vsl_url"] -- quando o projeto Supabase caiu,
  // quem ja havia visitado continuava puxando o link morto do cache. Esta limpeza
  // devolve esses visitantes ao video que funciona.
  useEffect(() => {
    try { localStorage.removeItem("vsl_url"); } catch {}
  }, []);

  // Preload do poster da VSL para acelerar LCP no mobile.
  useEffect(() => {
    if (!vslThumbnail) return;
    const existing = document.querySelector<HTMLLinkElement>(`link[rel="preload"][href="${vslThumbnail}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = vslThumbnail;
    (link as any).fetchPriority = "high";
    document.head.appendChild(link);
  }, [vslThumbnail]);

  useEffect(() => {
    (async () => {
      // Import dinâmico: o cliente do Supabase pesa ~211kB e nada acima da
      // dobra depende dele. Carregando aqui, ele sai do bundle inicial e é
      // baixado em paralelo, sem atrasar o hero.
      const { supabase } = await import("@/integrations/supabase/client");
      const [{ data: settings }, { data: imgs }, { data: bts }, { data: pls }] = await Promise.all([
        supabase.from("site_settings").select("key,value").neq("key", "preview_video"),
        supabase.from("proof_images").select("url").order("position", { ascending: true }),
        supabase.from("beats").select("name,url,key,bpm,image_url,genre,active").eq("active", true).order("position", { ascending: true }),
        supabase.from("playlists" as any).select("id,name,url").order("position", { ascending: true }),
      ]);
      const map = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
      setCheckoutUrl(map["checkout_url"] || CHECKOUT_URL_FALLBACK);
      setCheckoutUrlSupreme(map["checkout_url_supreme"] || CHECKOUT_URL_SUPREME_FALLBACK);
      setCheckoutUrlUpsell(map["checkout_url_upsell"] || CHECKOUT_URL_UPSELL_FALLBACK);
      setVslThumbnail(map["vsl_thumbnail"] || VSL_THUMBNAIL_FALLBACK);
      // So substitui a reserva local se o banco realmente devolver imagens --
      // resposta vazia zerava a secao de avaliacoes em vez de manter os prints.
      const doBanco = (imgs ?? []).map((r: any) =>
        String(r.url).replace(/([?&])dl=1/, "$1raw=1")
      );
      if (doBanco.length > 0) setProofImages(doBanco);
      // So troca a lista local se o banco devolver beats de verdade.
      const beatsDoBanco = (bts ?? []) as BeatItem[];
      if (beatsDoBanco.length > 0) setBeats(beatsDoBanco);
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

    // Forward all current URL params (utm_*, fbclid, gclid, etc.) to checkout
    let destination = target;
    try {
      const url = new URL(target);
      const incoming = new URLSearchParams(window.location.search);
      incoming.forEach((value, key) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      destination = url.toString();
    } catch {
      /* target não é URL absoluta: usa como veio */
    }

    // Navega na mesma aba (window.open é bloqueado no in-app browser do
    // Instagram/TikTok), mas só depois que os pixels tiverem disparado.
    // O AddToCart sai como beacon de imagem pro KawaiPay e leva ~800ms;
    // navegar no mesmo tick cancelava a requisição e perdia a conversão.
    let navigated = false;
    const go = () => {
      if (navigated) return;
      navigated = true;
      window.location.href = destination;
    };

    (window as any).dataLayer = (window as any).dataLayer || [];

    // Sem GTM carregado (ele entra depois do load) não há o que esperar:
    // o eventCallback nunca viria e o usuário ficaria travado à toa.
    if (!(window as any).google_tag_manager) {
      (window as any).dataLayer.push({ event: "AddToCart" });
      go();
      return;
    }

    (window as any).dataLayer.push({
      event: "AddToCart",
      // O GTM chama assim que todas as tags do evento terminam — normalmente
      // bem antes do teto abaixo.
      eventCallback: go,
      eventTimeout: CHECKOUT_BEACON_TIMEOUT_MS,
    });
    // Rede de segurança: se alguma tag travar, o eventCallback pode não vir.
    window.setTimeout(go, CHECKOUT_BEACON_TIMEOUT_MS);
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
      <main>
      <section className="hero-section relative overflow-hidden pt-16 pb-6 md:pt-8 md:pb-8" style={{ backgroundImage: "var(--gradient-hero)" }}>
        {/* EYEBROW -- acima do logo. Mesmo conteudo que antes vivia numa faixa
            solta no topo do site; agora faz parte do bloco de texto da hero.
            Visual da faixa preta com negrito dourado restaurado a pedido. */}
        <div className="hero-fade-block w-full bg-black border-b border-border/50 py-2 px-4 -mt-16 md:-mt-8">
          <p className="text-center text-[11px] md:text-xs text-white/80">
            <span className="font-black text-primary">7 anos</span> produzindo ·{" "}
            <span className="font-black text-primary">+120 artistas</span> atendidos ·{" "}
            <span className="font-black text-primary">zero I.A.</span>
          </p>
        </div>

        {/* Logo dentro da própria seção do hero: como header separado com
            fundo preto, o gradiente esverdeado do topo do hero criava uma
            emenda de cor visível na divisa entre os dois. */}
        <header className="top-bar w-full flex items-center justify-center pt-6 pb-10 md:pt-8 md:pb-12">
          <img
            src={logoNovaRealeza}
            alt="Nova Realeza"
            className="top-bar-logo h-12 md:h-16 w-auto"
            loading="eager"
            decoding="async"
          />
        </header>
        <div className={`${CONTAINER} text-center flex flex-col items-center`}>
          {/* H1 */}
          <h1
            className="hero-title hero-fade-block font-extrabold tracking-tight leading-[1.1] text-[40px] md:text-[64px] text-white text-center mx-auto"
            style={{ animationDelay: "80ms" }}
          >
            Seu som travou no lançamento porque o beat é do <span className="text-accent">YouTube</span> 💀
          </h1>

          {/* SUBTITULO */}
          <p
            className="hero-fade mx-auto max-w-[34ch] text-[20px] md:text-[26px]"
            style={{ fontWeight: 500, color: "#E5E5E5", lineHeight: 1.35, marginTop: 20, animationDelay: "200ms" }}
          >
            120 beats de trap em WAV, mixados, liberados pra lançar em qualquer distribuidora.
          </p>

          {/* LINHA DE PRECO */}
          <p
            className="hero-fade text-[20px] md:text-[26px]"
            style={{ marginTop: 8, animationDelay: "320ms" }}
          >
            <span style={{ fontWeight: 700, color: "#ffffff" }}>R$47,90</span>
            <span style={{ fontWeight: 400, color: "#A3A3A3" }}> · sai a R$0,40 por beat</span>
          </p>

          {/* LEGENDA DO GRID -- fora do H1, imediatamente acima do grid */}
          <p
            className="hero-fade uppercase text-center text-[12px]"
            style={{ letterSpacing: "0.08em", color: "#A3A3A3", marginTop: 28, animationDelay: "520ms" }}
          >
            Ouça algumas prévias
          </p>

          {/* Grade de prévias dos beats. Segura o id="ouca-antes" que a barra
              sticky observa pra saber se o usuário já passou dessa área --
              antes a VSL ficava aqui embaixo dela; agora que a VSL saiu do
              site, o id migrou pra cá. */}
          <div id="ouca-antes" className="w-full scroll-mt-20 mt-3">
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
                {/* Preenche o espaço vazio que sobra na última linha da grade
                    (7 beats em colunas de 2 ou 4 sempre deixa 1 slot livre). */}
                <div
                  className="flex items-center justify-center text-center aspect-square p-3 md:p-5"
                  style={{
                    background: "#111111",
                    border: "1px dashed #333333",
                    borderRadius: 10,
                  }}
                >
                  <span className="text-lg md:text-2xl font-black text-primary">e muito +</span>
                </div>
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

            <p className="mt-6 text-center text-xs md:text-sm font-bold uppercase tracking-wide text-white/60">
              O que você leva?
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 reveal">
              {genres.map((g, i) => (
                <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 text-xs tracking-wider uppercase">
                  {g}
                </Badge>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Âncora de preço + Garantia + Oferta com bônus e CTA -- tudo em um
          bloco só, logo abaixo da grade de prévias do hero. */}
      <section className="py-10 md:py-14 border-t border-border/50">
        <div className={CONTAINER}>
          {/* BLOCO 2 — Card de Compra (oferta única: 120 beats de trap).
              Pack 50 removido -- só existe o pack completo agora. Fica em
              primeiro no bloco pra impactar rápido, logo após o CTA do hero;
              garantia e âncora de preço vêm depois, como reforço. */}
          <div id="pack-basico" className="flex flex-col gap-6 max-w-2xl mx-auto items-stretch scroll-mt-20">
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

                <h3 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">
                  <span className="supreme-title">PACK 120 BEATS</span>
                </h3>
                <p className="mt-2 text-sm md:text-base text-[#d9c98e] font-semibold tracking-wide">
                  Pacote completo
                </p>

                <div className="mt-6 flex flex-col items-center gap-1">
                  <span className="text-base md:text-lg font-bold text-white/50 line-through decoration-destructive decoration-2">
                    R$ 127
                  </span>
                  <span className="supreme-price text-5xl md:text-6xl font-black leading-none">
                    R$ 47,90
                  </span>
                  <span className="text-[11px] text-[#d9c98e]/80">
                    R$ 0,40 por beat
                  </span>
                </div>

                {/* Selos -- Arquivos WAV / Licença assinada / Zero I.A. */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] md:text-xs font-bold text-primary">
                    <Music2 className="h-3 w-3 flex-shrink-0" />
                    Arquivos WAV
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] md:text-xs font-bold text-primary">
                    <FileCheck className="h-3 w-3 flex-shrink-0" />
                    Licença assinada
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] md:text-xs font-bold text-primary">
                    <User className="h-3 w-3 flex-shrink-0" />
                    Zero I.A.
                  </span>
                </div>

                <div className="mt-8 space-y-3.5 text-left max-w-md mx-auto">
                  {[
                    "120 beats de trap",
                    "Mixados em alta qualidade",
                    "100% Royalty Free — Spotify, TikTok, Insta etc",
                  ].map((f, i) => (
                    <div key={i} className="supreme-feature">
                      <span className="supreme-feature-check">
                        <Check />
                      </span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Bônus em sub-card: separa visualmente o que é extra do que
                    já é o pacote base, pra o valor agregado não se perder no
                    meio da lista. */}
                <div className="supreme-bonus-card mt-6 max-w-md mx-auto text-left">
                  <p className="supreme-bonus-title">
                    <span aria-hidden="true">🎁</span>
                    Bônus inclusos
                  </p>
                  <div className="mt-3 space-y-3.5">
                    {[
                      "Bônus 1: 28 presets pra Bandlab",
                      "Bônus 2: 28 presets vocais pra FL Studio",
                      // TODO(jurídico): confirmar enquadramento deste sorteio na Lei
                      // 14.790/23 (loterias/sorteios vinculados a compra) antes de manter
                      // ativo — ver item 8 do plano de ação.
                      "🍀 Bônus 3: Sorteio — Produção completa (mix, master, beat exclusivo, capa e distribuição para todas as plataformas digitais)",
                    ].map((f, i) => (
                      <div key={i} className="supreme-feature">
                        <span className="supreme-feature-gift" aria-hidden="true">
                          🎁
                        </span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 mx-auto max-w-[280px] rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    120 licenças custariam
                  </p>
                  <p className="text-lg font-black text-white leading-none">
                    <span className="line-through decoration-destructive decoration-2 text-white/60">R$ 7.200</span>{" "}
                    <span className="text-primary">R$ 47,90</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Beat sai em média R$ 60 no mercado × 120
                  </p>
                </div>

                <div className="mt-8 flex flex-col items-center w-full">
                  <button
                    onClick={() => handleCheckout(checkoutUrlSupreme || checkoutUrl, "gold")}
                    className="supreme-cta inline-flex items-center justify-center"
                  >
                    <span className="supreme-cta-shine" aria-hidden="true" />
                    <Download className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">QUERO MEUS 120 BEATS</span>
                  </button>
                </div>
                <p className="mt-4 text-xs text-[#d9c98e] flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Garantia incondicional de 7 dias · Pagamento 100% seguro</span>
                </p>
              </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setLicenseZoomOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs md:text-sm font-bold shadow-[0_2px_10px_rgba(255,196,0,0.35)] hover:brightness-110 active:scale-95 transition"
              >
                <FileCheck className="h-3.5 w-3.5" />
                Ver prévia da licença
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("avaliacoes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs md:text-sm font-bold shadow-[0_2px_10px_rgba(255,196,0,0.35)] hover:brightness-110 active:scale-95 transition"
              >
                <Star className="h-3.5 w-3.5" />
                Ver avaliações
              </button>
            </div>
          </div>

          <div className="mt-10 max-w-3xl mx-auto reveal">
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
                    Garantia de <span className="text-[#f0d78c]">7 Dias</span>
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

      <section className="py-6 md:py-8 bg-background border-t border-border/50">
        <div className={CONTAINER}>
          {/* BLOCO 1 — Antes vs Depois */}
          <div className="text-center mb-14 reveal">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.05]">
              Pare de pegar beat no <span className="text-accent">YouTube</span>
              <br />
              eles são genéricos e você não pode postar nas plataformas
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
                  "Beat de I.A. genérico, sem alma nenhuma",
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
                  "Feito na mão por produtor de verdade, zero I.A.",
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
        </div>
      </section>

      {/* Licença de verdade */}
      <section className="py-10 md:py-14 bg-background border-t border-border/50">
        <div className={CONTAINER}>
          <div className="max-w-4xl mx-auto reveal">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF7F]/10 border border-[#00FF7F]/30 text-[#00FF7F] text-xs font-bold uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5" />
                100% Legal · Assinado no Gov.br
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Sua Música Merece uma <span className="text-[#00FF7F]">Licença de Verdade</span>
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
                className="absolute inset-0 bg-[#00FF7F]/40 blur-[90px] rounded-full scale-90 pointer-events-none"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setLicenseZoomOpen(true)}
                className="group relative block w-full cursor-zoom-in rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF7F]"
                aria-label="Ampliar contrato de licença assinada"
              >
                <img
                  src={licencaAssinada}
                  alt="Contrato de licença de uso de beat da Nova Realeza, assinado digitalmente via Gov.br — dados pessoais borrados por segurança"
                  className="license-float relative w-full rounded-2xl border border-[#00FF7F]/40 shadow-[0_0_60px_-10px_rgba(0,255,127,0.5)]"
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="1377"
                />
                <span className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-opacity group-hover:bg-black/85">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                  Ampliar
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Avaliações */}
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

      {/* Como recebe */}
      <section className="py-10 md:py-14 bg-background border-t border-border/50">
        <div className={CONTAINER}>
          <div className="mt-10 md:mt-12 max-w-3xl mx-auto reveal">
            <div
              className="rounded-2xl p-6 md:p-8 border border-primary/30 bg-[#0a0a0a] text-center"
              style={{ boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.25)" }}
            >
              <div className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-4 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-14 h-14 md:w-20 md:h-20"
                  fill="#25D366"
                  aria-hidden="true"
                >
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.1-.472-.15-.671.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.671-1.612-.919-2.207-.242-.579-.487-.5-.671-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.001 2C6.478 2 2 6.477 2 12c0 1.98.579 3.885 1.671 5.53L2 22l4.47-1.671A9.947 9.947 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2z" />
                </svg>
              </div>
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
                    <div className="text-xs text-[#d9c98e]">Link do Drive enviado na hora</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl p-4 border border-border/60 bg-background/40">
                  <span className="flex items-center justify-center h-11 w-11 rounded-full bg-primary/15 text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">Gmail</div>
                    <div className="text-xs text-[#d9c98e]">Acesso vitalício no e-mail</div>
                  </div>
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
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        </div>
      </section>

      {/* CTA de fechamento — sem isso, todo o conteudo que mais convence
          (garantia, licenca, avaliacoes, antes/depois, FAQ) vinha depois do
          ultimo botao de compra da pagina, sem nenhuma chance de conversao. */}
      <section className="py-10 md:py-14 border-t border-border/50 bg-card/20">
        <div className={`${CONTAINER} max-w-xl text-center reveal`}>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Já viu o suficiente. <span className="text-primary">Bora gravar?</span>
          </h2>
          <div className="mt-6 flex flex-col items-center w-full">
            <button
              onClick={() => handleCheckout(checkoutUrlSupreme || checkoutUrl, "gold")}
              className="supreme-cta inline-flex items-center justify-center"
            >
              <span className="supreme-cta-shine" aria-hidden="true" />
              <Download className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">QUERO MEUS 120 BEATS</span>
            </button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Garantia incondicional de 7 dias · Pagamento 100% seguro
          </p>
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

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {`© ${new Date().getFullYear()} Nova Realeza. Todos os direitos reservados.`}
          </p>
        </div>
      </footer>
      </main>

      {/* Só monta (e só baixa o chunk) depois que um beat é aberto */}
      {openBeatIndex !== null && (
        <Suspense fallback={null}>
          <BeatCarouselDialog
            beats={beats.slice(0, 12)}
            openIndex={openBeatIndex}
            onClose={() => { setOpenBeatIndex(null); pauseCurrent(); }}
            meta={BEAT_META}
          />
        </Suspense>
      )}

      {showStickyCta && (
        <div className="sticky-cta-bar">
          <button
            onClick={() => document.getElementById("oferta-suprema")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="sticky-cta-btn"
          >
            QUERO MEUS 120 BEATS · R$ 47,90
          </button>
        </div>
      )}


      {licenseZoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Contrato de licença assinada, ampliado"
          onClick={() => setLicenseZoomOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          style={{ background: "rgba(0,0,0,0.92)" }}
        >
          <button
            type="button"
            onClick={() => setLicenseZoomOpen(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <img
            src={licencaAssinada}
            alt="Contrato de licença de uso de beat da Nova Realeza, assinado digitalmente via Gov.br — dados pessoais borrados por segurança"
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-[0_0_80px_-10px_rgba(0,255,127,0.4)]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showUpsell && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowUpsell(false)}
          className="upsell-dialog-overlay fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="upsell-dialog-card relative w-full max-w-[400px]"
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
              Adicione +70 beats ao seu pack por apenas R$8,00 a mais!
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
                💰 Você economiza R$10,00
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
                SIM! QUERO O PACK 120 POR R$27,90
              </button>
              <button
                onClick={() => {
                  setShowUpsell(false);
                  executeCheckout(checkoutUrl);
                }}
                className="w-full bg-transparent border border-white/30 rounded-lg py-2 hover:bg-white/10 hover:border-white/60 transition"
                style={{ color: "#bbb", fontSize: "14px", fontWeight: 500 }}
              >
                Não, quero apenas o Pack 50
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

