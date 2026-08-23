import { useEffect, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoCircle } from "d3-geo";
import { countries, type Point } from "@/lib/geo";

const SIZE = 320;

export default function Globe({ target, spin = true }: { target: Point; spin?: boolean }) {
  const [rot, setRot] = useState<[number, number]>([-target.lng - 90, -target.lat]);
  const raf = useRef<number | null>(null);

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
      const e = 1 - Math.pow(1 - k, 3);
      setRot([from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e]);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target.lat, target.lng, spin]);

  const { land, grat, sphere, marker, visible } = useMemo(() => {
    const proj = geoOrthographic()
      .fitSize([SIZE - 12, SIZE - 12], { type: "Sphere" })
      .translate([SIZE / 2, SIZE / 2])
      .rotate([rot[0], rot[1]]);
    const path = geoPath(proj);
    const pt = proj([target.lng, target.lat]);
    const c = geoCircle().center([target.lng, target.lat]).radius(2.2)();
    return {
      land: countries.features.map((f) => path(f) ?? ""),
      grat: path(geoGraticule10()) ?? "",
      sphere: path({ type: "Sphere" }) ?? "",
      marker: pt,
      visible: !!path(c),
    };
  }, [rot, target.lat, target.lng]);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[320px]" aria-hidden="true">
      <defs>
        <radialGradient id="globeShade" cx="35%" cy="30%">
          <stop offset="0%" stopColor="var(--ocean)" />
          <stop offset="75%" stopColor="var(--ocean-deep)" />
          <stop offset="100%" stopColor="var(--background)" />
        </radialGradient>
      </defs>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 4} fill="var(--ocean-deep)" opacity={0.25} />
      <path d={sphere} fill="url(#globeShade)" stroke="var(--border)" />
      <path d={grat} fill="none" stroke="var(--ocean)" strokeWidth={0.4} opacity={0.6} />
      {land.map((d, i) => (
        <path key={i} d={d} fill="var(--land)" stroke="var(--background)" strokeWidth={0.3} />
      ))}
      {visible && marker && (
        <g transform={`translate(${marker[0]},${marker[1]})`}>
          <circle r={4} fill="var(--primary)" />
          <circle r={6} fill="none" stroke="var(--primary)" strokeWidth={1.2}>
            <animate attributeName="r" values="5;18" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
}
