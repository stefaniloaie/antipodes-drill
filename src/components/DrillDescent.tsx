import { useEffect, useRef, useState } from "react";
import { LAYERS, THROUGH_KM, EARTH_RADIUS_KM, tempAtDepth } from "@/lib/geo";

const DURATION = 7000;

const LAYER_CONFIG = [
  { color: "#a87b52", glow: "159, 100, 60" },
  { color: "#c4813a", glow: "180, 110, 40" },
  { color: "#d97c2b", glow: "210, 120, 30" },
  { color: "#f0a020", glow: "240, 160, 20" },
  { color: "#ffcc44", glow: "255, 200, 50" },
];

function layerAt(depthKm: number) {
  const d = depthKm > EARTH_RADIUS_KM ? THROUGH_KM - depthKm : depthKm;
  return LAYERS.findIndex((l) => d <= l.depth);
}

export default function DrillDescent({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevLayerRef = useRef(-1);
  const raf = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / DURATION);
      setP(k);

      // flash on layer transition
      const depth = k * THROUGH_KM;
      const li = layerAt(depth);
      if (li !== prevLayerRef.current && prevLayerRef.current !== -1) {
        setFlash(true);
        setTimeout(() => setFlash(false), 280);
      }
      prevLayerRef.current = li;

      if (k < 1) raf.current = requestAnimationFrame(step);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 400);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [onDone]);

  const depth = p * THROUGH_KM;
  const layerIdx = Math.max(0, layerAt(depth));
  const layer = LAYERS[layerIdx]!;
  const cfg = LAYER_CONFIG[layerIdx]!;
  const temp = tempAtDepth(depth);
  const heat = Math.min(1, temp / 5400);
  const speed = Math.sin(Math.PI * p);
  const shake = 0.4 + speed * 1.8;

  const prevDepth = layerIdx === 0 ? 0 : LAYERS[layerIdx - 1]!.depth;
  const realDepth = depth > EARTH_RADIUS_KM ? THROUGH_KM - depth : depth;
  const layerPct = Math.round(Math.min(100, ((realDepth - prevDepth) / (layer.depth - prevDepth)) * 100));

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      style={{ background: "#050608" }}
    >
      {/* Scrolling earth cross-section */}
      <div
        className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
        style={{ opacity: 0.55, transform: `translateY(${-p * 200}vh)` }}
      />
      <div
        className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
        style={{ opacity: 0.55, transform: `translateY(${-p * 200}vh) scaleY(-1)`, marginTop: "400vh" }}
      />

      {/* Strata */}
      <div
        className="strata absolute inset-x-0 h-[800vh] will-change-transform"
        style={{ opacity: 0.18, transform: `translateY(${-p * 420}vh)` }}
      />

      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0.22) 4px)",
          zIndex: 2,
        }}
      />

      {/* Core radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${cfg.glow},${heat * 0.45}) 0%, transparent 70%)`,
          transition: "background 0.8s ease",
        }}
      />

      {/* Layer-transition flash */}
      {flash && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(${cfg.glow}, 0.18)`, zIndex: 3 }}
        />
      )}

      {/* Motion streaks */}
      <div className="streaks absolute inset-0" style={{ opacity: 0.07 + speed * 0.28 }} />

      {/* Embers */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full"
            style={{
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              background: cfg.color,
              filter: `blur(${(i % 2) * 0.5}px)`,
              left: `${(i * 41) % 100}%`,
              top: `${48 + ((i * 19) % 48)}%`,
              opacity: heat * 0.85,
              animation: `ember-rise ${1 + (i % 5) * 0.28}s linear ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Drill head */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          zIndex: 5,
          animation: "drill-shake 0.11s linear infinite",
          ["--shake" as string]: shake,
        }}
      >
        {/* Heat aura */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 300, height: 300,
            background: `radial-gradient(circle, rgba(${cfg.glow},${0.3 + heat * 0.5}) 0%, transparent 65%)`,
          }}
        />
        <svg width="72" height="122" viewBox="0 0 72 122" aria-hidden className="relative">
          {/* shaft highlight */}
          <rect x="26" y="1" width="8" height="52" fill="rgba(255,255,255,0.08)" rx="2" />
          {/* shaft body */}
          <rect x="26" y="1" width="20" height="54" fill="#1e2533" rx="2" />
          <rect x="27" y="2" width="4" height="52" fill="rgba(255,255,255,0.06)" />
          {/* collar */}
          <rect x="20" y="49" width="32" height="14" fill="#161c27" rx="1" />
          <rect x="21" y="50" width="30" height="3" fill="rgba(255,255,255,0.05)" />
          {/* bit */}
          <path d="M20 63 L52 63 L36 118 Z" fill="#12161f" />
          <path d="M36 63 L52 63 L36 118 Z" fill="rgba(0,0,0,0.35)" />
          {/* tip glow */}
          <circle cx="36" cy="117" r="5" fill={cfg.color} opacity={0.85 + heat * 0.15} />
          <circle cx="36" cy="117" r="10" fill={cfg.color} opacity={heat * 0.3} />
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(0,0,0,0.82) 100%)",
          zIndex: 6,
        }}
      />

      {/* Letterbox */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[9vh] bg-[#050608]" style={{ zIndex: 7 }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[9vh] bg-[#050608]" style={{ zIndex: 7 }} />

      {/* ── TOP HUD ── */}
      <div className="absolute inset-x-0 top-0 px-6 py-5 sm:px-12 sm:py-6" style={{ zIndex: 8 }}>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-3">

          {/* Depth */}
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              DEPTH
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(2.2rem,5.5vw,4rem)", lineHeight: 1, color: "#fff", letterSpacing: "-0.02em" }}>
              {Math.round(depth).toLocaleString()}
              <span style={{ fontSize: "1rem", marginLeft: "0.4rem", color: "rgba(255,255,255,0.4)" }}>km</span>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              TEMP
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.4rem,3.5vw,2.6rem)", lineHeight: 1, color: cfg.color, letterSpacing: "-0.02em", transition: "color 0.8s ease" }}>
              {temp.toLocaleString()}
              <span style={{ fontSize: "0.85rem", marginLeft: "0.3rem", color: "rgba(255,255,255,0.3)" }}>°C</span>
            </div>
          </div>

          {/* Speed */}
          <div className="hidden sm:block">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              SPEED
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.2rem,2.8vw,2rem)", lineHeight: 1, color: "rgba(255,255,255,0.6)" }}>
              {Math.round(speed * 2200).toLocaleString()}
              <span style={{ fontSize: "0.75rem", marginLeft: "0.3rem", color: "rgba(255,255,255,0.25)" }}>km/h</span>
            </div>
          </div>

          {/* Pressure */}
          <div className="hidden md:block">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              PRESSURE
            </p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(1.2rem,2.8vw,2rem)", lineHeight: 1, color: "rgba(255,255,255,0.6)" }}>
              {Math.round((realDepth / EARTH_RADIUS_KM) * 360).toLocaleString()}
              <span style={{ fontSize: "0.75rem", marginLeft: "0.3rem", color: "rgba(255,255,255,0.25)" }}>GPa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM HUD ── */}
      <div className="absolute inset-x-0 bottom-0 px-6 py-5 sm:px-12 sm:py-6" style={{ zIndex: 8 }}>

        {/* Layer card */}
        <div
          style={{
            maxWidth: 480,
            borderRadius: 16,
            border: `1px solid rgba(${cfg.glow}, 0.25)`,
            background: "rgba(5,6,8,0.78)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            boxShadow: `0 0 40px rgba(${cfg.glow}, ${0.08 + heat * 0.14})`,
            transition: "border-color 0.6s ease, box-shadow 0.6s ease",
          }}
        >
          {/* color stripe */}
          <div style={{ height: 3, background: cfg.color, width: `${layerPct}%`, transition: "width 0.15s linear, background 0.6s ease" }} />
          <div style={{ padding: "14px 18px 16px" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", letterSpacing: "0.18em", color: cfg.color, textTransform: "uppercase", transition: "color 0.6s ease" }}>
                  {layer.temp}
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.1rem,2.5vw,1.5rem)", color: "#fff", marginTop: 2 }}>
                  {layer.name}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginTop: 5, lineHeight: 1.55 }}>
                  {layer.note}
                </p>
              </div>

              {/* Circular pct */}
              <svg width="48" height="48" viewBox="0 0 48 48" className="mt-1 shrink-0">
                <circle cx="24" cy="24" r="19" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                <circle
                  cx="24" cy="24" r="19"
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 38}`}
                  strokeDashoffset={`${Math.PI * 38 * (1 - layerPct / 100)}`}
                  transform="rotate(-90 24 24)"
                  style={{ transition: "stroke-dashoffset 0.15s linear, stroke 0.6s ease" }}
                />
                <text x="24" y="28" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.7)" fontFamily="monospace">
                  {layerPct}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Global progress */}
        <div className="mt-4 flex items-center gap-3">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", width: 28 }}>
            {Math.round(p * 100)}%
          </span>
          <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${p * 100}%`,
                background: `linear-gradient(90deg, #3b9eff 0%, ${cfg.color} 100%)`,
                boxShadow: `0 0 10px ${cfg.color}`,
                transition: "width 0.1s linear, background 0.6s ease, box-shadow 0.6s ease",
              }}
            />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", width: 54, textAlign: "right" }}>
            {Math.round(THROUGH_KM - depth).toLocaleString()} km
          </span>
        </div>

        {/* Layer dots */}
        <div className="mt-3 flex gap-2">
          {LAYERS.map((l, i) => (
            <div
              key={l.name}
              title={l.name}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= layerIdx ? LAYER_CONFIG[i]!.color : "rgba(255,255,255,0.08)",
                transition: "background 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
