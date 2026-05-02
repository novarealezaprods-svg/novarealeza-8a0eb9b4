import { useEffect, useRef, useState } from "react";

export function ScarcityBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setAnimate(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const percent = 82;

  return (
    <div ref={ref} className="scarcity-bar">
      <div className="scarcity-top">
        <div className="scarcity-badge">
          <span className="scarcity-dot" />
          <span>Vagas Limitadas</span>
        </div>
        <div className="scarcity-restantes">
          Apenas <strong>18 restantes</strong>
        </div>
      </div>

      <div className="scarcity-barra-wrap">
        <div className="scarcity-barra-fundo">
          <div
            className="scarcity-barra-fill"
            style={{ width: animate ? `${percent}%` : "0%" }}
          />
        </div>
        <div
          className="scarcity-marker"
          style={{ left: animate ? `${percent}%` : "0%" }}
        />
      </div>

      <div className="scarcity-legenda">
        <span className="scarcity-leg-v">82% já garantiram</span>
      </div>
    </div>
  );
}
