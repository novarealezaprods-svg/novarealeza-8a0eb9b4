import { useEffect, useRef, useState } from "react";

export type TypeSegment = { text: string; className?: string; breakAfter?: boolean };

interface TypeRevealProps {
  segments: TypeSegment[];
  speed?: number;
  startDelay?: number;
  start?: boolean;
  showCursor?: boolean;
  onDone?: () => void;
}

// Efeito de "digitando aos poucos" pro H1/subtitulo do hero -- dá uma leitura
// hierarquica (titulo termina, so' depois o subtitulo começa) em vez de tudo
// aparecer de uma vez.
export function TypeReveal({ segments, speed = 24, startDelay = 0, start = true, showCursor = true, onDone }: TypeRevealProps) {
  const fullLength = segments.reduce((n, s) => n + s.text.length, 0);
  const [count, setCount] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(fullLength);
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    let tickTimer: ReturnType<typeof setTimeout>;
    const startTimer = setTimeout(function tick(i = 1) {
      setCount(i);
      if (i < fullLength) {
        tickTimer = setTimeout(() => tick(i + 1), speed);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
    }, startDelay);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(tickTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, fullLength, speed, startDelay]);

  let remaining = count;
  const nodes: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    const take = Math.max(0, Math.min(seg.text.length, remaining));
    remaining -= seg.text.length;
    if (take > 0) {
      nodes.push(
        <span key={i} className={seg.className}>
          {seg.text.slice(0, take)}
        </span>
      );
    }
    if (seg.breakAfter && take === seg.text.length) {
      nodes.push(<br key={`br-${i}`} />);
    }
  });

  return (
    <>
      {nodes}
      {showCursor && start && count < fullLength && (
        <span className="hero-typing-cursor" aria-hidden="true" />
      )}
    </>
  );
}
