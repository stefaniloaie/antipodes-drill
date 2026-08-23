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
      <rect width={W} height={H} fill="var(--ocean-deep)" />
      <path d={graticule} fill="none" stroke="var(--ocean)" strokeWidth={0.4} opacity={0.5} />
      <g>
        {paths.map(({ d, i }) => (
          <path
            key={i}
            d={d}
            fill="var(--land)"
            stroke="var(--background)"
            strokeWidth={0.4}
            className="transition-[fill] duration-200 hover:fill-[var(--crust)]"
          />
        ))}
      </g>

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
        />
      )}

      {o && (
        <g transform={`translate(${o[0]},${o[1]})`}>
          <circle r={5} fill="none" stroke="var(--primary)" strokeWidth={1.5} opacity={0.8}>
            <animate attributeName="r" values="4;14" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle r={4} fill="var(--primary)" />
        </g>
      )}

      {t && (
        <g transform={`translate(${t[0]},${t[1]})`}>
          <circle r={4} fill="var(--accent)" />
          <circle r={8} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
        </g>
      )}
    </svg>
  );
}
