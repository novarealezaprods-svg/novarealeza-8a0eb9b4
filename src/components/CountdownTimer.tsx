import { useEffect, useState } from "react";

const STORAGE_KEY = "offer_expires_at";
const DURATION_MS = 24 * 60 * 60 * 1000;

function getOrCreateExpiry(): number {
  if (typeof window === "undefined") return Date.now() + DURATION_MS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!parsed || isNaN(parsed) || parsed <= Date.now()) {
    const next = Date.now() + DURATION_MS;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  }
  return parsed;
}

function format(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer() {
  const [expiresAt, setExpiresAt] = useState<number>(() => getOrCreateExpiry());
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setExpiresAt(getOrCreateExpiry());
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= expiresAt) {
        const next = t + DURATION_MS;
        window.localStorage.setItem(STORAGE_KEY, String(next));
        setExpiresAt(next);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const remaining = Math.max(0, expiresAt - now);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const blocks: Array<[number, string]> = [
    [hours, "Horas"],
    [minutes, "Min"],
    [seconds, "Seg"],
  ];

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs md:text-sm text-muted-foreground mb-3 tracking-wide">
        ⏳ Oferta expira em
      </p>
      <div className="rounded-xl border border-border/60 bg-[#0a0a0a] px-4 py-4 md:px-6 md:py-5 flex items-center justify-center gap-2 md:gap-3">
        {blocks.map(([value, label], i) => (
          <div key={label} className="flex items-center gap-2 md:gap-3">
            <div className="flex flex-col items-center min-w-[58px] md:min-w-[72px]">
              <span
                className="font-black tabular-nums leading-none text-3xl md:text-5xl"
                style={{ color: "#00FF41", textShadow: "0 0 12px rgba(0, 255, 65, 0.45)" }}
              >
                {format(value)}
              </span>
              <span className="mt-1.5 text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
            </div>
            {i < blocks.length - 1 && (
              <span
                className="font-black text-2xl md:text-4xl leading-none -mt-3 md:-mt-4"
                style={{ color: "#00FF41", opacity: 0.7 }}
                aria-hidden="true"
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
