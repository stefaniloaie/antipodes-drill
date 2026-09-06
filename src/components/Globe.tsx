import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoCircle, geoDistance } from "d3-geo";
import { countries, type Point, countryAt, oceanAt } from "@/lib/geo";

const SIZE = 360;
const R = SIZE / 2 - 10;
const cx = SIZE / 2;
const cy = SIZE / 2;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function Globe({
  target,
  origin,
  spin = true,
}: {
  target: Point;
  origin?: Point | null;
  spin?: boolean;
}) {
  // rotation: [longitude, latitude] (d3 convention: negated)
  const [rot, setRot] = useState<[number, number]>([-target.lng - 90, -target.lat]);
  const [scale, setScale] = useState(1);
  const [hover, setHover] = useState<string | null>(null);

  const raf = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; rot: [number, number] } | null>(null);

  // Initial spin-to-target animation
  useEffect(() => {
    const to: [number, number] = [-target.lng, -target.lat];
    if (!spin) {
      setRot(to);
      return;
    }
    const from: [number, number] = [to[0] - 120, to[1] - 25];
    const t0 = performance.now();
    const dur = 1600;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = easeOutCubic(k);
      setRot([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target.lat, target.lng, spin]);

  // Drag-to-rotate
  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      svgRef.current?.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, rot: [...rot] as [number, number] };
    },
    [rot],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!drag.current) {
        // hover tooltip
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const sx = ((e.clientX - rect.left) / rect.width) * SIZE;
        const sy = ((e.clientY - rect.top) / rect.height) * SIZE;
        const dx = sx - cx,
          dy = sy - cy;
        const effectiveR = R * scale;
        if (dx * dx + dy * dy > effectiveR * effectiveR) {
          setHover(null);
          return;
        }
        // unproject using current rotation
        const proj = geoOrthographic()
          .fitSize([SIZE - 20, SIZE - 20], { type: "Sphere" })
          .translate([cx, cy])
          .scale(R * scale)
          .rotate(rot);
        const coords = proj.invert?.([sx, sy]);
        if (coords) {
          const p: Point = { lng: coords[0], lat: coords[1] };
          const name = countryAt(p) ?? oceanAt(p);
          setHover(name);
        }
        return;
      }
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      const sensitivity = 0.35 / scale;
      setRot([
        drag.current.rot[0] + dx * sensitivity,
        Math.max(-90, Math.min(90, drag.current.rot[1] - dy * sensitivity)),
      ]);
    },
    [rot, scale],
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  // Scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setScale((s) => Math.max(0.7, Math.min(4, s - e.deltaY * 0.003)));
  }, []);

  const { land, grat, sphere, targetPt, targetVisible, originPt, originVisible } = useMemo(() => {
    const proj = geoOrthographic()
      .fitSize([SIZE - 20, SIZE - 20], { type: "Sphere" })
      .translate([cx, cy])
      .scale(R * scale)
      .rotate(rot);
    const path = geoPath(proj);

    const tCircle = geoCircle().center([target.lng, target.lat]).radius(2.5)();
    const tPt = proj([target.lng, target.lat]) as [number, number] | null;

    let oPt: [number, number] | null = null;
    let oVis = false;
    if (origin) {
      const oCircle = geoCircle().center([origin.lng, origin.lat]).radius(2.5)();
      oPt = proj([origin.lng, origin.lat]) as [number, number] | null;
      oVis = !!path(oCircle);
    }

    return {
      land: countries.features.map((f) => ({ d: path(f) ?? "", id: f })),
      grat: path(geoGraticule10()) ?? "",
      sphere: path({ type: "Sphere" }) ?? "",
      targetPt: tPt,
      targetVisible: !!path(tCircle),
      originPt: oPt,
      originVisible: oVis,
    };
  }, [rot, scale, target.lat, target.lng, origin]);

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[360px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        aria-label="Interactive globe — drag to rotate, scroll to zoom"
      >
        <defs>
          <radialGradient id="gOcean" cx="32%" cy="26%" r="72%">
            <stop offset="0%" stopColor="var(--ocean)" />
            <stop offset="55%" stopColor="var(--ocean-deep)" />
            <stop offset="100%" stopColor="oklch(0.28 0.07 225)" />
          </radialGradient>
          <radialGradient id="gSpecular" cx="30%" cy="24%" r="35%">
            <stop offset="0%" stopColor="white" stopOpacity="0.32" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gNight" cx="76%" cy="72%" r="58%">
            <stop offset="0%" stopColor="oklch(0.10 0.05 240)" stopOpacity="0.62" />
            <stop offset="100%" stopColor="oklch(0.10 0.05 240)" stopOpacity="0" />
          </radialGradient>
          <filter id="atmosBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="markerGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="globeClip">
            <circle cx={cx} cy={cy} r={R * scale + 1} />
          </clipPath>
        </defs>

        {/* Atmosphere halo */}
        <circle
          cx={cx}
          cy={cy}
          r={R * scale + 16}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={28}
          strokeOpacity={0.09}
          filter="url(#atmosBlur)"
        />
        <circle
          cx={cx}
          cy={cy}
          r={R * scale + 4}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={4}
          strokeOpacity={0.13}
        />

        {/* Ocean */}
        <path d={sphere} fill="url(#gOcean)" stroke="var(--border)" strokeWidth={0.6} />

        {/* Graticule */}
        <g clipPath="url(#globeClip)">
          <path d={grat} fill="none" stroke="var(--ocean)" strokeWidth={0.4} opacity={0.4} />
        </g>

        {/* Land */}
        <g clipPath="url(#globeClip)">
          {land.map(({ d }, i) => (
            <path key={i} d={d} fill="var(--land)" stroke="var(--background)" strokeWidth={0.3} />
          ))}
        </g>

        {/* Night shadow */}
        <path d={sphere} fill="url(#gNight)" clipPath="url(#globeClip)" />
        {/* Specular */}
        <path d={sphere} fill="url(#gSpecular)" clipPath="url(#globeClip)" />

        {/* Origin pin (where the drill started) */}
        {originVisible && originPt && (
          <g transform={`translate(${originPt[0]},${originPt[1]})`} filter="url(#markerGlow)">
            <circle r={4} fill="var(--primary)" />
            <circle r={7} fill="none" stroke="var(--primary)" strokeWidth={1.2} opacity={0.6} />
          </g>
        )}

        {/* Antipode marker — double-ring pulse */}
        {targetVisible && targetPt && (
          <g transform={`translate(${targetPt[0]},${targetPt[1]})`} filter="url(#markerGlow)">
            <circle r={5} fill="var(--accent)" />
            <circle r={7} fill="none" stroke="var(--accent)" strokeWidth={1.5}>
              <animate attributeName="r" values="5;22" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r={7} fill="none" stroke="var(--accent)" strokeWidth={1}>
              <animate
                attributeName="r"
                values="9;28"
                dur="2s"
                begin="0.65s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;0"
                dur="2s"
                begin="0.65s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>

      {/* Hover tooltip */}
      {hover && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-1">
          <span className="rounded-full border border-border bg-card/90 px-3 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
            {hover}
          </span>
        </div>
      )}

      {/* Controls hint */}
      <p className="mt-1 text-center font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        drag · scroll to zoom
      </p>
    </div>
  );
}
