import { useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoPath, geoGraticule10, geoCentroid } from "d3-geo";
import { countries, countryAt, oceanAt, type Point } from "@/lib/geo";

const W = 960;
const H = 480;

const OCEAN_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: "Pacific Ocean", lat: 5, lng: -155 },
  { name: "Atlantic Ocean", lat: 10, lng: -30 },
  { name: "Indian Ocean", lat: -20, lng: 75 },
  { name: "Arctic Ocean", lat: 82, lng: 0 },
  { name: "Southern Ocean", lat: -65, lng: 0 },
];

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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  const { paths, graticule, project, invert, oceanLabelPts } = useMemo(() => {
    const projection = geoEquirectangular().fitSize([W, H], { type: "Sphere" });
    const path = geoPath(projection);
    const oceanPts = OCEAN_LABELS.map((o) => {
      const pt = projection([o.lng, o.lat]);
      return { name: o.name, x: pt?.[0] ?? 0, y: pt?.[1] ?? 0 };
    });
    return {
      paths: countries.features.map((f, i) => ({
        d: path(f) ?? "",
        i,
        centroid: geoCentroid(f),
      })),
      graticule: path(geoGraticule10()) ?? "",
      project: (p: Point) => projection([p.lng, p.lat]) ?? [0, 0],
      invert: projection.invert!,
      oceanLabelPts: oceanPts,
    };
  }, []);

  function toSvgCoords(e: React.MouseEvent<SVGSVGElement>): [number, number] {
    const rect = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H];
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (disabled) return;
    const [x, y] = toSvgCoords(e);
    const c = invert([x, y]);
    if (!c) return;
    onPick({ lng: c[0], lat: c[1] });
    setTooltip(null);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const [x, y] = toSvgCoords(e);
    const c = invert([x, y]);
    if (!c) {
      setTooltip(null);
      return;
    }
    const p: Point = { lng: c[0], lat: c[1] };
    const name = countryAt(p) ?? oceanAt(p);
    const screenX = (x / W) * svgRef.current!.getBoundingClientRect().width;
    const screenY = (y / H) * svgRef.current!.getBoundingClientRect().height;
    setTooltip({ x: screenX, y: screenY, label: name });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  const o = origin ? project(origin) : null;
  const t = target ? project(target) : null;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full select-none ${disabled ? "cursor-default" : "cursor-crosshair"}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label="World map — click any point to drill through the Earth"
      >
        <defs>
          <radialGradient id="oceanGrad" cx="50%" cy="38%" r="78%">
            <stop offset="0%" stopColor="var(--ocean)" stopOpacity={0.8} />
            <stop offset="55%" stopColor="var(--ocean-deep)" stopOpacity={0.92} />
            <stop offset="100%" stopColor="var(--background)" stopOpacity={1} />
          </radialGradient>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--crust)" />
            <stop offset="100%" stopColor="var(--land)" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
            <stop offset="60%" stopColor="var(--background)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--background)" stopOpacity={0.72} />
          </radialGradient>
          <filter id="landRelief" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="1.4"
              stdDeviation="1.6"
              floodColor="#000"
              floodOpacity={0.18}
            />
          </filter>
          <filter id="markerGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="labelShadow" x="-10%" y="-30%" width="120%" height="160%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor="var(--ocean-deep)"
              floodOpacity={0.7}
            />
          </filter>
        </defs>

        {/* Ocean */}
        <rect width={W} height={H} fill="url(#oceanGrad)" />

        {/* Graticule — 30° major, 10° minor via opacity */}
        <path d={graticule} fill="none" stroke="var(--ocean)" strokeWidth={0.4} opacity={0.3} />

        {/* Land */}
        <g filter="url(#landRelief)">
          {paths.map(({ d, i }) => (
            <path
              key={i}
              d={d}
              fill="url(#landGrad)"
              stroke="var(--primary)"
              strokeOpacity={0.3}
              strokeWidth={0.4}
              className="transition-[fill-opacity] duration-150 hover:fill-[var(--crust)]"
            />
          ))}
        </g>

        {/* Ocean basin labels */}
        {oceanLabelPts.map((o) => (
          <text
            key={o.name}
            x={o.x}
            y={o.y}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
            fill="var(--ocean)"
            opacity={0.55}
            filter="url(#labelShadow)"
            style={{ textTransform: "uppercase", userSelect: "none", pointerEvents: "none" }}
          >
            {o.name}
          </text>
        ))}

        {/* Vignette */}
        <rect width={W} height={H} fill="url(#vignette)" pointerEvents="none" />

        {/* Drill line — animated dash */}
        {o && t && (
          <line
            x1={o[0]}
            y1={o[1]}
            x2={t[0]}
            y2={t[1]}
            stroke="var(--primary)"
            strokeWidth={1.4}
            strokeDasharray="6 5"
            opacity={0.7}
            filter="url(#markerGlow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-110"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </line>
        )}

        {/* Origin marker — animated sonar ring */}
        {o && (
          <g transform={`translate(${o[0]},${o[1]})`} filter="url(#markerGlow)">
            <circle r={14} fill="none" stroke="var(--primary)" strokeWidth={1} opacity={0.5}>
              <animate attributeName="r" values="5;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r={4.5} fill="var(--primary)" />
          </g>
        )}

        {/* Target (antipode) marker */}
        {t && (
          <g transform={`translate(${t[0]},${t[1]})`} filter="url(#markerGlow)">
            <circle r={4.5} fill="var(--accent)" />
            <circle r={9} fill="none" stroke="var(--accent)" strokeWidth={1.2} opacity={0.65} />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute rounded border border-border bg-card/90 px-2 py-1 font-mono text-[10px] text-foreground backdrop-blur-sm shadow-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 20 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
