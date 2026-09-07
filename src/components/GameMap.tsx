import { useEffect, useRef } from "react";
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
import type { Point } from "@/lib/geo";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function pulseIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};box-shadow:0 0 0 0 ${color};animation:leaflet-pulse 2s infinite;position:relative;"><div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.5;animation:leaflet-pulse-ring 2s infinite;"></div></div>`,
  });
}

function questionIcon() {
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:50%;background:rgba(59,158,255,0.18);border:2px solid rgba(59,158,255,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;animation:leaflet-pulse 2.5s infinite;">?</div>`,
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

function FitBothPoints({ a, b }: { a: Point; b: Point }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    fitted.current = true;
    map.flyToBounds(L.latLngBounds([a.lat, a.lng], [b.lat, b.lng]), {
      padding: [80, 80],
      maxZoom: 5,
      duration: 1.4,
    });
  }, [a, b, map]);
  return null;
}

const MAP_STYLES = `
  @keyframes leaflet-pulse { 0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 0 transparent} }
  @keyframes leaflet-pulse-ring { 0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.8);opacity:0} }
  .leaflet-container { background: #e8e4d9; }
`;

function lineSegments(a: Point, b: Point): [number, number][][] {
  const pa: [number, number] = [a.lat, a.lng];
  const pb: [number, number] = [b.lat, b.lng];
  if (Math.abs(b.lng - a.lng) > 180) {
    const mid = (a.lat + b.lat) / 2;
    return a.lng > 0
      ? [
          [pa, [mid, 180]],
          [[mid, -180], pb],
        ]
      : [
          [pa, [mid, -180]],
          [[mid, 180], pb],
        ];
  }
  return [[pa, pb]];
}

// ── Pick map (origin selection) ────────────────────────────────────────────────

export function PickMap({ onPick }: { onPick: (p: Point) => void }) {
  return (
    <div className="relative flex-1" style={{ minHeight: "calc(100vh - 140px)" }}>
      <style>{MAP_STYLES}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 140px)" }}
        worldCopyJump
        className="z-0 cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler onPick={onPick} />
      </MapContainer>
      <div
        className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10"
        style={{ zIndex: 400 }}
      >
        <div className="rounded-full border border-primary/30 bg-background/80 px-5 py-2 font-mono text-xs tracking-widest text-primary/70 backdrop-blur-sm uppercase">
          Click anywhere to set your drill site
        </div>
      </div>
    </div>
  );
}

// ── Guess map ──────────────────────────────────────────────────────────────────

export function GuessMap({ guess, onPick }: { guess: Point | null; onPick: (p: Point) => void }) {
  return (
    <div className="relative flex-1" style={{ minHeight: "calc(100vh - 160px)" }}>
      <style>{MAP_STYLES}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 160px)" }}
        worldCopyJump
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler onPick={onPick} />
        {!guess && (
          <Marker position={[20, 0]} icon={questionIcon()}>
            <Popup>Click anywhere to place your guess</Popup>
          </Marker>
        )}
        {guess && (
          <Marker position={[guess.lat, guess.lng]} icon={pulseIcon("#f59e0b")}>
            <Popup>Your guess</Popup>
          </Marker>
        )}
      </MapContainer>
      {!guess && (
        <div
          className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10"
          style={{ zIndex: 400 }}
        >
          <div className="rounded-full border border-primary/30 bg-background/80 px-5 py-2 font-mono text-xs tracking-widest text-primary/70 backdrop-blur-sm uppercase">
            Click anywhere on the map to place your guess
          </div>
        </div>
      )}
    </div>
  );
}

// ── Result map ─────────────────────────────────────────────────────────────────

export function ResultMap({
  guess,
  actual,
  originName,
}: {
  guess: Point;
  actual: Point;
  originName: string;
}) {
  const segs = lineSegments(guess, actual);
  return (
    <div
      className="overflow-hidden rounded-xl border border-border shadow-sm"
      style={{ minHeight: 480 }}
    >
      <style>{MAP_STYLES}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        style={{ height: "100%", width: "100%", minHeight: 480 }}
        worldCopyJump
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <FitBothPoints a={guess} b={actual} />
        <Marker position={[guess.lat, guess.lng]} icon={pulseIcon("#f59e0b")}>
          <Popup>
            <strong>Your guess</strong>
            <br />
            {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}°
          </Popup>
        </Marker>
        <Marker position={[actual.lat, actual.lng]} icon={pulseIcon("#ef4444")}>
          <Popup>
            <strong>Actual antipode of {originName}</strong>
            <br />
            {actual.lat.toFixed(3)}°, {actual.lng.toFixed(3)}°
          </Popup>
        </Marker>
        {segs.map((seg, i) => (
          <Polyline
            key={i}
            positions={seg}
            pathOptions={{ color: "#ef4444", weight: 2, opacity: 0.7, dashArray: "6 5" }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
