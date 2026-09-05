import { useEffect, useRef, useState } from "react";
import { LAYERS, THROUGH_KM, EARTH_RADIUS_KM, tempAtDepth } from "@/lib/geo";

const DURATION = 7000;

function layerAt(depthKm: number) {
  const d = depthKm > EARTH_RADIUS_KM ? THROUGH_KM - depthKm : depthKm;
  return LAYERS.find((l) => d <= l.depth) ?? LAYERS[LAYERS.length - 1]!;
}

const LAYER_COLORS = [
  "oklch(0.62 0.05 70)",    // crust
  "oklch(0.7 0.1 55)",      // upper mantle
  "oklch(0.78 0.14 60)",    // lower mantle
  "oklch(0.85 0.18 75)",    // outer core
  "oklch(0.93 0.16 85)",    // inner core
];

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
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [onDone]);

  const depth = p * THROUGH_KM;
  const layer = layerAt(depth);
  const layerIdx = LAYERS.indexOf(layer);
  const temp = tempAtDepth(depth);
  const heat = Math.min(1, temp / 5400);

  const speed = Math.sin(Math.PI * p);
  const shake = 0.5 + speed * 1.6;

  // layer progress within the current layer
  const prevDepth = layerIdx === 0 ? 0 : LAYERS[layerIdx - 1]!.depth;
  const realDepth = depth > EARTH_RADIUS_KM ? THROUGH_KM - depth : depth;
  const layerProgress = (realDepth - prevDepth) / (layer.depth - prevDepth);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: "oklch(0.08 0.02 240)" }}>
      {/* Earth cross-section background */}
      <div
        className="absolute inset-x-0 h-[400vh] will-change-transform earth-gradient"
        style={{ top: 0, transform: `translateY(${-p * 200}vh)` }}
      />
      <div
        className="absolute inset-x-0 h-[400vh] will-change-transform earth-gradient"
        style={{ top: 0, transform: `translateY(${-p * 200}vh) scaleY(-1)`, marginTop: "400vh" }}
      />

      {/* Strata lines */}
      <div
        className="strata absolute inset-x-0 h-[800vh] opacity-25 mix-blend-multiply will-change-transform"
        style={{ top: 0, transform: `translateY(${-p * 420}vh)` }}
      />

      {/* Motion streaks */}
      <div className="streaks absolute inset-0 will-change-transform" style={{ opacity: 0.1 + speed * 0.4 }} />

      {/* Radial heat glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, oklch(0.93 0.16 85) ${heat * 60}%, transparent), transparent 55%)`,
          opacity: heat,
        }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)" }}
      />

      {/* Embers */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full blur-[1px]"
            style={{
              width: `${1.5 + (i % 4)}px`,
              height: `${1.5 + (i % 4)}px`,
              background: `oklch(${0.8 + (i % 3) * 0.05} 0.18 ${75 + (i % 5) * 8})`,
              left: `${(i * 37) % 100}%`,
              top: `${50 + ((i * 19) % 45)}%`,
              opacity: heat * 0.9,
              animation: `ember-rise ${1.1 + (i % 5) * 0.3}s linear ${i * 0.09}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Drill head */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "drill-shake 0.12s linear infinite", ["--shake" as string]: shake }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 280, height: 280,
            background: `radial-gradient(circle, color-mix(in oklab, oklch(0.93 0.16 85) ${40 + heat * 45}%, transparent), transparent 65%)`,
            opacity: 0.35 + heat * 0.65,
          }}
        />
        <svg width="68" height="118" viewBox="0 0 68 118" aria-hidden className="relative drop-shadow-lg">
          {/* shaft */}
          <rect x="24" y="0" width="20" height="54" fill="oklch(0.55 0.05 240)" rx="2" />
          {/* collar */}
          <rect x="18" y="48" width="32" height="14" fill="oklch(0.45 0.04 240)" rx="1" />
          {/* bit body */}
          <path d="M18 62 L50 62 L34 114 Z" fill="oklch(0.35 0.03 240)" />
          <path d="M34 62 L50 62 L34 114 Z" fill="oklch(0.28 0.02 240)" opacity="0.7" />
          {/* tip glow */}
          <circle cx="34" cy="113" r="4" fill={`color-mix(in oklab, oklch(0.93 0.16 85) ${heat * 100}%, oklch(0.55 0.04 240))`} />
        </svg>
      </div>

      {/* Letterbox bars */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[8vh]" style={{ background: "oklch(0.08 0.02 240)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[8vh]" style={{ background: "oklch(0.08 0.02 240)" }} />

      {/* ── TOP HUD ── */}
      <div className="absolute inset-x-0 top-0 px-6 py-5 sm:px-10 sm:py-7">
        <div className="flex flex-wrap items-end gap-x-12 gap-y-4">
          {/* Depth counter */}
          <div>
            <p className="mono-label mb-1 text-white/40">DEPTH</p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-mono tabular-nums text-white"
                style={{ fontSize: "clamp(2.4rem,6vw,4.5rem)", lineHeight: 1 }}
              >
                {Math.round(depth).toLocaleString()}
              </span>
              <span className="font-mono text-base text-white/50">km</span>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <p className="mono-label mb-1 text-white/40">SKIN TEMP</p>
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-mono tabular-nums"
                style={{
                  fontSize: "clamp(1.6rem,4vw,2.8rem)",
                  lineHeight: 1,
                  color: `color-mix(in oklab, oklch(0.93 0.16 85) ${heat * 100}%, white)`,
                }}
              >
                {temp.toLocaleString()}
              </span>
              <span className="font-mono text-sm text-white/50">°C</span>
            </div>
          </div>

          {/* Speed indicator */}
          <div className="hidden sm:block">
            <p className="mono-label mb-1 text-white/40">DRILL SPEED</p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl tabular-nums text-white/80">
                {Math.round(speed * 1820).toLocaleString()}
              </span>
              <span className="font-mono text-sm text-white/40">km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HUD ── */}
      <div className="absolute inset-x-0 bottom-0 px-6 py-5 sm:px-10 sm:py-7">
        {/* Layer card */}
        <div
          className="max-w-lg overflow-hidden rounded-2xl backdrop-blur-xl"
          style={{
            background: "color-mix(in oklab, oklch(0.14 0.03 240) 85%, transparent)",
            border: "1px solid color-mix(in oklab, white 12%, transparent)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* colored top stripe = current layer */}
          <div
            className="h-1 w-full"
            style={{ background: LAYER_COLORS[layerIdx] ?? "var(--primary)" }}
          />
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono-label mb-0.5" style={{ color: LAYER_COLORS[layerIdx] }}>
                  {layer.temp}
                </p>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">{layer.name}</h2>
                <p className="mt-1 text-sm text-white/55 leading-relaxed">{layer.note}</p>
              </div>
              {/* mini layer progress arc */}
              <svg width="44" height="44" viewBox="0 0 44 44" className="mt-1 shrink-0">
                <circle cx="22" cy="22" r="18" fill="none" stroke="white" strokeWidth="3" strokeOpacity={0.1} />
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke={LAYER_COLORS[layerIdx]}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 36}`}
                  strokeDashoffset={`${Math.PI * 36 * (1 - Math.min(1, layerProgress))}`}
                  transform="rotate(-90 22 22)"
                />
                <text x="22" y="26" textAnchor="middle" fontSize="10" fill="white" fontFamily="monospace">
                  {Math.round(Math.min(100, layerProgress * 100))}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Global progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <span className="mono-label text-white/30 w-8">{Math.round(p * 100)}%</span>
          <div className="relative flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${p * 100}%`,
                background: `linear-gradient(90deg, var(--primary) 0%, ${LAYER_COLORS[layerIdx]} 100%)`,
                boxShadow: `0 0 8px ${LAYER_COLORS[layerIdx]}`,
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <span className="mono-label text-white/30 w-12 text-right">{Math.round(THROUGH_KM - depth).toLocaleString()} km</span>
        </div>

        {/* Layer indicators row */}
        <div className="mt-3 flex gap-1.5">
          {LAYERS.map((l, i) => (
            <div
              key={l.name}
              className="h-0.5 flex-1 rounded-full transition-opacity"
              style={{
                background: LAYER_COLORS[i],
                opacity: i <= layerIdx ? 1 : 0.2,
              }}
              title={l.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
