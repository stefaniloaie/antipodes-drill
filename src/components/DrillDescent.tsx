import { useEffect, useRef, useState } from "react";
import { LAYERS, THROUGH_KM, EARTH_RADIUS_KM, tempAtDepth } from "@/lib/geo";

const DURATION = 4000;

const LAYER_CONFIG = [
  { color: "#a87b52", glow: "168,123,82", label: "CRUST" },
  { color: "#c4813a", glow: "196,129,58", label: "UPPER MANTLE" },
  { color: "#d97c2b", glow: "217,124,43", label: "LOWER MANTLE" },
  { color: "#f0a020", glow: "240,160,32", label: "OUTER CORE" },
  { color: "#ffcc44", glow: "255,204,68", label: "INNER CORE" },
];

function layerIdxAt(depthKm: number) {
  const d = depthKm > EARTH_RADIUS_KM ? THROUGH_KM - depthKm : depthKm;
  const i = LAYERS.findIndex((l) => d <= l.depth);
  return i === -1 ? LAYERS.length - 1 : i;
}

export default function DrillDescent({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [coreReached, setCoreReached] = useState(false);
  const [emerging, setEmerging] = useState(false);
  const prevLayerRef = useRef(-1);
  const coreRef = useRef(false);
  const emergingRef = useRef(false);
  const raf = useRef<number | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / DURATION);
      setP(k);

      const depth = k * THROUGH_KM;
      const li = layerIdxAt(depth);

      // layer flash
      if (li !== prevLayerRef.current && prevLayerRef.current !== -1) {
        const c = LAYER_CONFIG[li]?.glow ?? "255,255,255";
        setFlash(c);
        setTimeout(() => setFlash(null), 320);
      }
      prevLayerRef.current = li;

      // core breach
      if (!coreRef.current && depth >= EARTH_RADIUS_KM * 0.96) {
        coreRef.current = true;
        setCoreReached(true);
        setTimeout(() => setCoreReached(false), 2200);
      }

      // emerging
      if (!emergingRef.current && k >= 0.88) {
        emergingRef.current = true;
        setEmerging(true);
      }

      if (k < 1) raf.current = requestAnimationFrame(step);
      else if (!done.current) {
        done.current = true;
        setTimeout(onDone, 500);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [onDone]);

  const depth = p * THROUGH_KM;
  const layerIdx = layerIdxAt(depth);
  const layer = LAYERS[layerIdx]!;
  const cfg = LAYER_CONFIG[layerIdx]!;
  const temp = tempAtDepth(depth);
  const heat = Math.min(1, temp / 5400);
  const speed = Math.sin(Math.PI * p);
  const shake = emerging ? 0.2 : 0.4 + speed * 2.2;

  const prevDepth = layerIdx === 0 ? 0 : LAYERS[layerIdx - 1]!.depth;
  const realDepth = depth > EARTH_RADIUS_KM ? THROUGH_KM - depth : depth;
  const layerPct = Math.round(
    Math.min(100, ((realDepth - prevDepth) / (layer.depth - prevDepth)) * 100),
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      style={{ background: "#050608" }}
    >
      {/* Earth cross-section */}
      <div
        className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
        style={{
          opacity: emerging ? 0.15 : 0.6,
          transform: `translateY(${-p * 200}vh)`,
          transition: "opacity 1.5s ease",
        }}
      />
      <div
        className="absolute inset-x-0 h-[400vh] earth-gradient will-change-transform"
        style={{
          opacity: emerging ? 0.15 : 0.6,
          transform: `translateY(${-p * 200}vh) scaleY(-1)`,
          marginTop: "400vh",
          transition: "opacity 1.5s ease",
        }}
      />
      <div
        className="strata absolute inset-x-0 h-[800vh] will-change-transform"
        style={{ opacity: 0.15, transform: `translateY(${-p * 420}vh)` }}
      />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
          zIndex: 2,
        }}
      />

      {/* Core glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(${cfg.glow},${heat * 0.5}) 0%, transparent 65%)`,
          transition: "background 1s ease",
          zIndex: 1,
        }}
      />

      {/* Layer-transition flash */}
      {flash && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(${flash},0.22)`, zIndex: 10, pointerEvents: "none" }}
        />
      )}

      {/* CORE BREACH banner */}
      {coreReached && (
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
          style={{
            zIndex: 20,
            animation: "core-breach-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.5em",
              color: `rgb(${LAYER_CONFIG[4]!.glow})`,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            ━━━━ WARNING ━━━━
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.8rem,8vw,6rem)",
              color: LAYER_CONFIG[4]!.color,
              letterSpacing: "0.04em",
              textShadow: `0 0 60px rgba(${LAYER_CONFIG[4]!.glow},0.9)`,
              lineHeight: 1,
            }}
          >
            INNER CORE
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.35em",
              color: `rgba(${LAYER_CONFIG[4]!.glow},0.7)`,
              marginTop: 10,
              textTransform: "uppercase",
            }}
          >
            5 400 °C · MAX PRESSURE
          </div>
        </div>
      )}

      {/* EMERGING banner */}
      {emerging && (
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ zIndex: 20 }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              color: "rgba(100,200,255,0.8)",
              textTransform: "uppercase",
              animation: "emerge-fade 0.5s ease forwards",
            }}
          >
            ANTIPODE APPROACH
          </div>
        </div>
      )}

      {/* Motion streaks */}
      <div
        className="streaks absolute inset-0"
        style={{ opacity: emerging ? 0.04 : 0.06 + speed * 0.3, zIndex: 1 }}
      />

      {/* Embers */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full"
            style={{
              width: `${1 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              background: cfg.color,
              filter: `blur(${(i % 2) * 0.6}px)`,
              left: `${(i * 41) % 100}%`,
              top: `${46 + ((i * 21) % 50)}%`,
              opacity: heat * 0.9,
              animation: `ember-rise ${0.9 + (i % 5) * 0.25}s linear ${i * 0.07}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Drill */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          zIndex: 5,
          animation: `drill-shake 0.1s linear infinite`,
          ["--shake" as string]: shake,
          opacity: coreReached ? 0.4 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 340,
            height: 340,
            background: `radial-gradient(circle, rgba(${cfg.glow},${0.25 + heat * 0.55}) 0%, transparent 60%)`,
            transition: "background 1s ease",
          }}
        />
        <svg width="72" height="124" viewBox="0 0 72 124" aria-hidden className="relative">
          <rect x="26" y="1" width="20" height="54" fill="#1a2030" rx="2" />
          <rect x="27" y="2" width="5" height="52" fill="rgba(255,255,255,0.07)" rx="1" />
          <rect x="20" y="49" width="32" height="14" fill="#141820" rx="1" />
          <rect x="21" y="50" width="30" height="3" fill="rgba(255,255,255,0.04)" />
          <path d="M20 63 L52 63 L36 120 Z" fill="#0e1218" />
          <path d="M36 63 L52 63 L36 120 Z" fill="rgba(0,0,0,0.4)" />
          <circle cx="36" cy="119" r="5.5" fill={cfg.color} opacity={0.9} />
          <circle cx="36" cy="119" r={9 + heat * 6} fill={cfg.color} opacity={heat * 0.35} />
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,0.85) 100%)",
          zIndex: 6,
        }}
      />

      {/* Letterbox */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[8vh] bg-[#050608]"
        style={{ zIndex: 7 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[8vh] bg-[#050608]"
        style={{ zIndex: 7 }}
      />

      {/* TOP HUD */}
      <div className="absolute inset-x-0 top-0 px-6 py-5 sm:px-12 sm:py-6" style={{ zIndex: 8 }}>
        <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              DEPTH
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(2rem,5vw,3.8rem)",
                lineHeight: 1,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              {Math.round(depth).toLocaleString()}
              <span
                style={{
                  fontSize: "0.9rem",
                  marginLeft: "0.35rem",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                km
              </span>
            </div>
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              TEMP
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(1.3rem,3.2vw,2.4rem)",
                lineHeight: 1,
                color: cfg.color,
                letterSpacing: "-0.02em",
                transition: "color 0.8s ease",
              }}
            >
              {temp.toLocaleString()}
              <span
                style={{
                  fontSize: "0.8rem",
                  marginLeft: "0.3rem",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                °C
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              SPEED
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(1.1rem,2.5vw,1.9rem)",
                lineHeight: 1,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {Math.round(speed * 2400).toLocaleString()}
              <span
                style={{
                  fontSize: "0.7rem",
                  marginLeft: "0.3rem",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                km/h
              </span>
            </div>
          </div>
          <div className="hidden md:block">
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.58rem",
                letterSpacing: "0.25em",
                color: "rgba(255,255,255,0.28)",
                textTransform: "uppercase",
              }}
            >
              PRESSURE
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(1.1rem,2.5vw,1.9rem)",
                lineHeight: 1,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              {Math.round((realDepth / EARTH_RADIUS_KM) * 360).toLocaleString()}
              <span
                style={{
                  fontSize: "0.7rem",
                  marginLeft: "0.3rem",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                GPa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD */}
      <div className="absolute inset-x-0 bottom-0 px-6 py-5 sm:px-12 sm:py-6" style={{ zIndex: 8 }}>
        <div
          style={{
            maxWidth: 500,
            borderRadius: 16,
            border: `1px solid rgba(${cfg.glow},0.22)`,
            background: "rgba(5,6,8,0.82)",
            backdropFilter: "blur(24px)",
            overflow: "hidden",
            boxShadow: `0 0 48px rgba(${cfg.glow},${0.06 + heat * 0.16})`,
            transition: "border-color 0.7s ease, box-shadow 0.7s ease",
          }}
        >
          <div
            style={{
              height: 3,
              background: cfg.color,
              width: `${layerPct}%`,
              transition: "width 0.12s linear, background 0.7s ease",
            }}
          />
          <div style={{ padding: "14px 18px 16px" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.2em",
                    color: cfg.color,
                    textTransform: "uppercase",
                    transition: "color 0.7s ease",
                  }}
                >
                  {cfg.label} · {layer.temp}
                </p>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1rem,2.4vw,1.45rem)",
                    color: "#fff",
                    marginTop: 3,
                  }}
                >
                  {layer.name}
                </h2>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.42)",
                    marginTop: 5,
                    lineHeight: 1.6,
                  }}
                >
                  {layer.note}
                </p>
              </div>
              <svg width="48" height="48" viewBox="0 0 48 48" className="mt-1 shrink-0">
                <circle
                  cx="24"
                  cy="24"
                  r="19"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="19"
                  fill="none"
                  stroke={cfg.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.PI * 38}`}
                  strokeDashoffset={`${Math.PI * 38 * (1 - layerPct / 100)}`}
                  transform="rotate(-90 24 24)"
                  style={{ transition: "stroke-dashoffset 0.12s linear, stroke 0.7s ease" }}
                />
                <text
                  x="24"
                  y="28"
                  textAnchor="middle"
                  fontSize="11"
                  fill="rgba(255,255,255,0.65)"
                  fontFamily="monospace"
                >
                  {layerPct}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.58rem",
              color: "rgba(255,255,255,0.22)",
              width: 28,
            }}
          >
            {Math.round(p * 100)}%
          </span>
          <div
            style={{
              flex: 1,
              height: 2,
              borderRadius: 2,
              background: "rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${p * 100}%`,
                background: `linear-gradient(90deg, #3b9eff 0%, ${cfg.color} 100%)`,
                boxShadow: `0 0 12px ${cfg.color}`,
                transition: "width 0.1s linear, background 0.7s ease, box-shadow 0.7s ease",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.58rem",
              color: "rgba(255,255,255,0.22)",
              width: 54,
              textAlign: "right",
            }}
          >
            {Math.round(THROUGH_KM - depth).toLocaleString()} km
          </span>
        </div>

        {/* Layer indicators */}
        <div className="mt-2.5 flex gap-1.5">
          {LAYERS.map((l, i) => (
            <div
              key={l.name}
              title={l.name}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= layerIdx ? LAYER_CONFIG[i]!.color : "rgba(255,255,255,0.07)",
                boxShadow: i === layerIdx ? `0 0 8px ${LAYER_CONFIG[i]!.color}` : "none",
                transition: "background 0.4s ease, box-shadow 0.4s ease",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes core-breach-in {
          0%   { opacity: 0; transform: translateY(-50%) scale(0.85); }
          15%  { opacity: 1; transform: translateY(-50%) scale(1.04); }
          80%  { opacity: 1; transform: translateY(-50%) scale(1);    }
          100% { opacity: 0; transform: translateY(-50%) scale(0.95); }
        }
        @keyframes emerge-fade {
          0%   { opacity: 0; letter-spacing: 0.8em; }
          100% { opacity: 1; letter-spacing: 0.4em; }
        }
      `}</style>
    </div>
  );
}
