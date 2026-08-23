import { useEffect, useRef, useState } from "react";
import { LAYERS, THROUGH_KM, EARTH_RADIUS_KM, tempAtDepth } from "@/lib/geo";

const DURATION = 7000;

function layerAt(depthKm: number) {
  const d = depthKm > EARTH_RADIUS_KM ? THROUGH_KM - depthKm : depthKm;
  return LAYERS.find((l) => d <= l.depth) ?? LAYERS[LAYERS.length - 1]!;
}

export default function DrillDescent({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const raf = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / DURATION);
      setP(k);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 350);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [onDone]);

  const depth = p * THROUGH_KM;
  const layer = layerAt(depth);
  const temp = tempAtDepth(depth);
  const heat = Math.min(1, temp / 5400);

  const speed = Math.sin(Math.PI * p);
  const shake = 0.5 + speed * 1.6;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background animate-fade-in">
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${1.04 + speed * 0.06})`, transformOrigin: "50% 48%" }}
      >
        {/* Travelling cross-section: two mirrored earth gradients scrolling upward */}
        <div
          className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
          style={{ top: 0, transform: `translateY(${-p * 200}vh)` }}
        />
        <div
          className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
          style={{ top: 0, transform: `translateY(${-p * 200}vh) scaleY(-1)`, marginTop: "400vh" }}
        />

        {/* strata bands scrolling past for parallax depth */}
        <div
          className="strata absolute inset-x-0 h-[800vh] opacity-40 mix-blend-overlay will-change-transform"
          style={{ top: 0, transform: `translateY(${-p * 420}vh)` }}
        />

        {/* motion streaks */}
        <div
          className="streaks absolute inset-0 will-change-transform"
          style={{ opacity: 0.15 + speed * 0.45 }}
        />
      </div>

      <div className="absolute inset-0 grain opacity-30" />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 48%, color-mix(in oklab, var(--inner-core) ${heat * 55}%, transparent), transparent 60%)`,
        }}
      />

      {/* cinematic vignette + chromatic edge */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 35%, color-mix(in oklab, black 78%, transparent) 100%)",
        }}
      />

      {/* embers */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-inner-core blur-[1px]"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 37) % 100}%`,
              top: `${50 + ((i * 17) % 45)}%`,
              opacity: heat,
              animation: `ember-rise ${1.2 + (i % 5) * 0.35}s linear ${i * 0.11}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Drill head */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: `drill-shake 0.12s linear infinite`, ["--shake" as string]: shake }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 260,
            height: 260,
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--inner-core) 45%, transparent), transparent 65%)",
            opacity: 0.4 + heat * 0.6,
          }}
        />
        <svg width="64" height="112" viewBox="0 0 64 112" aria-hidden="true" className="relative">
          <rect x="22" y="0" width="20" height="52" fill="var(--secondary)" />
          <rect x="18" y="46" width="28" height="12" fill="var(--muted-foreground)" />
          <path d="M18 58 L46 58 L32 108 Z" fill="var(--foreground)" />
          <path d="M32 58 L46 58 L32 108 Z" fill="var(--muted-foreground)" opacity="0.6" />
        </svg>
      </div>

      {/* letterbox bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[7vh] bg-[oklch(0.06_0_0)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[7vh] bg-[oklch(0.06_0_0)]" />


      {/* HUD */}
      <div className="absolute inset-x-0 top-0 p-6 sm:p-10">
        <p className="mono-label text-primary-foreground/70 mix-blend-difference">
          Drill telemetry
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-3">
          <div>
            <div className="font-mono text-4xl tabular-nums sm:text-6xl">
              {Math.round(depth).toLocaleString()}
              <span className="ml-1 text-xl">km</span>
            </div>
            <p className="mono-label opacity-70">depth travelled</p>
          </div>
          <div>
            <div className="font-mono text-2xl tabular-nums sm:text-4xl">
              {temp.toLocaleString()} °C
            </div>
            <p className="mono-label opacity-70">skin temperature</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
        <div className="max-w-lg rounded-lg border border-border/60 bg-background/70 p-5 backdrop-blur-md">
          <p className="mono-label text-primary">{layer.temp}</p>
          <h2 className="mt-1 text-2xl">{layer.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{layer.note}</p>
        </div>
        <div className="mt-5 h-[3px] w-full bg-border">
          <div className="h-full bg-primary" style={{ width: `${p * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
