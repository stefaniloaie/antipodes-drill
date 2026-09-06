import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { antipode, describe, formatCoord, type Point } from "@/lib/geo";

// Fix leaflet default marker icons (broken in bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function pulseIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};
      box-shadow:0 0 0 0 ${color};
      animation:leaflet-pulse 2s infinite;
      position:relative;
    ">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${color};opacity:0.5;
        animation:leaflet-pulse-ring 2s infinite;
      "></div>
    </div>`,
  });
}

function ClickHandler({ onPick }: { onPick: (p: Point) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ point }: { point: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 5), { duration: 1.2 });
  }, [point, map]);
  return null;
}

function FitBothPoints({ origin, target }: { origin: Point | null; target: Point | null }) {
  const map = useMap();
  useEffect(() => {
    if (!origin || !target) return;
    const bounds = L.latLngBounds([origin.lat, origin.lng], [target.lat, target.lng]);
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 5, duration: 1.4 });
  }, [origin?.lat, origin?.lng, target?.lat, target?.lng, map]);
  return null;
}

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const PRESETS = [
  { label: "London", lat: 51.5072, lng: -0.1276 },
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "Bucharest", lat: 44.4268, lng: 26.1025 },
  { label: "Madrid", lat: 40.4168, lng: -3.7038 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
  { label: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { label: "Cairo", lat: 30.0444, lng: 31.2357 },
  { label: "Mumbai", lat: 19.076, lng: 72.8777 },
  { label: "Beijing", lat: 39.9042, lng: 116.4074 },
  { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { label: "Paris", lat: 48.8566, lng: 2.3522 },
];

export default function AntipodeMap({
  onDrill,
  origin,
  target,
}: {
  onDrill: (p: Point, name?: string) => void;
  origin: Point | null;
  target: Point | null;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flyTarget, setFlyTarget] = useState<Point | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "denied">("idle");

  const searchPlace = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        setResults(data);
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlace(v), 420);
  };

  const pickResult = (r: NominatimResult) => {
    const p: Point = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setSearch(r.display_name.split(",")[0]!);
    setResults([]);
    setFlyTarget(p);
    onDrill(p, r.display_name.split(",")[0]);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: Point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeoState("idle");
        setFlyTarget(p);
        onDrill(p, "My location");
      },
      () => {
        setGeoState("denied");
        window.setTimeout(() => setGeoState("idle"), 2000);
      },
    );
  };

  const pickPreset = (p: (typeof PRESETS)[0]) => {
    setSearch(p.label);
    setResults([]);
    setDropdownOpen(false);
    const pt: Point = { lat: p.lat, lng: p.lng };
    setFlyTarget(pt);
    onDrill(pt, p.label);
  };

  // Antipode-connected line wrapping: two segments if it crosses the antimeridian
  const lineSegments: [number, number][][] = [];
  if (origin && target) {
    // If the origin→target crosses ±180° we split into two arcs
    const o: [number, number] = [origin.lat, origin.lng];
    const t: [number, number] = [target.lat, target.lng];
    const dLng = target.lng - origin.lng;
    if (Math.abs(dLng) > 180) {
      // crosses antimeridian
      const midLat = (origin.lat + target.lat) / 2;
      if (origin.lng > 0) {
        lineSegments.push([o, [midLat, 180]]);
        lineSegments.push([[midLat, -180], t]);
      } else {
        lineSegments.push([o, [midLat, -180]]);
        lineSegments.push([[midLat, 180], t]);
      }
    } else {
      lineSegments.push([o, t]);
    }
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Search + preset toolbar */}
      <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-border bg-card px-3 py-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={handleSearchInput}
            onFocus={() => search && setResults([])}
            placeholder="Search any city, country or place…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => pickResult(r)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="mt-0.5 text-primary">⌖</span>
                  <span className="text-foreground">
                    {r.display_name.split(",").slice(0, 3).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preset dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Cities
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path
                d="M2 3.5L5 6.5L8 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-[9999] mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => pickPreset(p)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Geolocation button */}
        <button
          onClick={handleGeolocate}
          disabled={geoState === "loading"}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {geoState === "loading" ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Locating…</span>
            </>
          ) : geoState === "denied" ? (
            <span className="text-destructive">Denied</span>
          ) : (
            <>
              <span>📍</span>
              <span>My location</span>
            </>
          )}
        </button>
      </div>

      {/* Map */}
      <div
        className="relative overflow-hidden rounded-b-xl border border-border"
        style={{ height: "70vh", minHeight: 480 }}
      >
        <style>{`
          @keyframes leaflet-pulse {
            0% { box-shadow: 0 0 0 0 currentColor; }
            70% { box-shadow: 0 0 0 14px transparent; }
            100% { box-shadow: 0 0 0 0 transparent; }
          }
          @keyframes leaflet-pulse-ring {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(2.8); opacity: 0; }
          }
          .leaflet-container { background: #e8e4d9; }
        `}</style>

        <MapContainer
          center={[20, 0]}
          zoom={3}
          minZoom={2}
          maxZoom={18}
          style={{ height: "100%", width: "100%" }}
          worldCopyJump
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <ClickHandler
            onPick={(p) => {
              setFlyTarget(null);
              onDrill(p);
            }}
          />
          <FlyTo point={flyTarget} />
          <FitBothPoints origin={origin} target={target} />

          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={pulseIcon("#3b9eff")}>
              <Popup className="drill-popup">
                <strong>Origin</strong>
                <br />
                {formatCoord(origin)}
              </Popup>
            </Marker>
          )}

          {target && (
            <Marker position={[target.lat, target.lng]} icon={pulseIcon("#f59e0b")}>
              <Popup className="drill-popup">
                <strong>Antipode</strong>
                <br />
                {formatCoord(target)}
                <br />
                <em>{describe(target).place}</em>
              </Popup>
            </Marker>
          )}

          {lineSegments.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg}
              pathOptions={{
                color: "#3b9eff",
                weight: 1.5,
                opacity: 0.55,
                dashArray: "6 6",
              }}
            />
          ))}
        </MapContainer>

        {/* Map hint overlay */}
        {!origin && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
            <div className="rounded-full border border-primary/30 bg-background/80 px-5 py-2 font-mono text-xs tracking-widest text-primary/70 backdrop-blur-sm uppercase">
              Click anywhere on the map to drill
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
