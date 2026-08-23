import { useMemo, useRef } from "react";
import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import { countries, type Point } from "@/lib/geo";

const W = 960;
const H = 480;

export default function WorldMap({
  onPick,
  origin,
  target,
  disabled,
}: {
  onPick: (p: Point) => void;
  origin: Point | null;
  target: Point | null;
  disabled?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { paths, graticule, project } = useMemo(() => {
    const projection = geoEquirectangular().fitSize([W, H], { type: "Sphere" });
    const path = geoPath(projection);
    return {
      paths: countries.features.map((f, i) => ({ d: path(f) ?? "", i })),
      graticule: path(geoGraticule10()) ?? "",
      project: (p: Point) => projection([p.lng, p.lat]) ?? [0, 0],
      invert: projection.invert,
    };
  }, []);

  const invert = useMemo(
    () => geoEquirectangular().fitSize([W, H], { type: "Sphere" }).invert!,
    [],
  );

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (disabled) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const c = invert([x, y]);
    if (!c) return;
    onPick({ lng: c[0], lat: c[1] });
  }

  const o = origin ? project(origin) : null;
  const t = target ? project(target) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full cursor-crosshair select-none"
      onClick={handleClick}
      role="img"
      aria-label="World map — click any point to drill through the Earth"
    >
      <defs>
        <radialGradient id="oceanGrad" cx="50%" cy="38%" r="78%">
          <stop offset="0%" stopColor="var(--ocean)" stopOpacity={0.55} />
          <stop offset="55%" stopColor="var(--ocean-deep)" stopOpacity={1} />
          <stop offset="100%" stopColor="var(--background)" stopOpacity={1} />
        </radialGradient>
        <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--crust)" />
          <stop offset="100%" stopColor="var(--land)" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
          <stop offset="60%" stopColor="var(--background)" stopOpacity={0} />
          <stop offset="100%" stopColor="var(--background)" stopOpacity={0.85} />
        </radialGradient>
        <filter id="landRelief" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#000" floodOpacity="0.6" />
        </filter>
        <filter id="markerGlow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={W} height={H} fill="url(#oceanGrad)" />
      <path d={graticule} fill="none" stroke="var(--ocean)" strokeWidth={0.35} opacity={0.28} />

      <g filter="url(#landRelief)">
        {paths.map(({ d, i }) => (
          <path
            key={i}
            d={d}
            fill="url(#landGrad)"
            stroke="var(--primary)"
            strokeOpacity={0.25}
            strokeWidth={0.4}
            className="transition-[fill-opacity] duration-200 hover:fill-[var(--crust)]"
          />
        ))}
      </g>

      {/* atmospheric sheen */}
      <rect width={W} height={H} fill="url(#vignette)" pointerEvents="none" />

      {o && t && (
        <line
          x1={o[0]}
          y1={o[1]}
          x2={t[0]}
          y2={t[1]}
          stroke="var(--primary)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.6}
          filter="url(#markerGlow)"
        />
      )}

      {o && (
        <g transform={`translate(${o[0]},${o[1]})`} filter="url(#markerGlow)">
          <circle r={5} fill="none" stroke="var(--primary)" strokeWidth={1.5} opacity={0.8}>
            <animate attributeName="r" values="4;14" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle r={4} fill="var(--primary)" />
        </g>
      )}

      {t && (
        <g transform={`translate(${t[0]},${t[1]})`} filter="url(#markerGlow)">
          <circle r={4} fill="var(--accent)" />
          <circle r={8} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
        </g>
      )}
    </svg>
  );
}
