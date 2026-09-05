import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DrillDescent from "@/components/DrillDescent";
import { antipode, type Point } from "@/lib/geo";

// Fix leaflet default marker icons (broken in bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Haversine ─────────────────────────────────────────────────────────────────

function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

// ── Cities ────────────────────────────────────────────────────────────────────

const GAME_CITIES = [
  { name: "London", lat: 51.5072, lng: -0.1276 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { name: "Lima", lat: -12.0464, lng: -77.0428 },
  { name: "Bogotá", lat: 4.711, lng: -74.0721 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
  { name: "Seoul", lat: 37.5665, lng: 126.978 },
  { name: "Tehran", lat: 35.6892, lng: 51.389 },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Auckland", lat: -36.8485, lng: 174.7633 },
  { name: "Reykjavik", lat: 64.1355, lng: -21.8954 },
  { name: "Anchorage", lat: 61.2181, lng: -149.9003 },
  { name: "Honolulu", lat: 21.3069, lng: -157.8583 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241 },
];

// ── Score helpers ─────────────────────────────────────────────────────────────

function scorePercent(distKm: number): number {
  return Math.max(0, Math.min(100, 100 - distKm / 200));
}

type Tier = {
  emoji: string;
  title: string;
  oneliner: string;
};

function scoreTier(pct: number): Tier {
  if (pct >= 95) return { emoji: "🌍", title: "Earth Whisperer", oneliner: "You could feel the magma cooling on your fingertips." };
  if (pct >= 80) return { emoji: "🧭", title: "Master Navigator", oneliner: "GPS would be proud. Very, very proud." };
  if (pct >= 60) return { emoji: "🗺️", title: "Seasoned Explorer", oneliner: "Close enough to smell the ocean — or the soil." };
  if (pct >= 40) return { emoji: "✈️", title: "Frequent Flyer", oneliner: "You've been around the world, just not quite through it." };
  if (pct >= 20) return { emoji: "🚢", title: "Lost at Sea", oneliner: "Somewhere on Earth. Technically correct is the best kind of correct." };
  return { emoji: "🪨", title: "Flat Earther", oneliner: "The drill came out where it wanted, not where you thought." };
}

// ── Map helpers ───────────────────────────────────────────────────────────────

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

function questionIcon() {
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:rgba(59,158,255,0.18);
      border:2px solid rgba(59,158,255,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;line-height:1;
      animation:leaflet-pulse 2.5s infinite;
    ">?</div>`,
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
    const bounds = L.latLngBounds([a.lat, a.lng], [b.lat, b.lng]);
    map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 5, duration: 1.4 });
  }, [a, b, map]);
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "drilling" | "guessing" | "result";

// ── Route ─────────────────────────────────────────────────────────────────────

const GAME_URL = "https://antipodes-drill.lovable.app/game";

export const Route = createFileRoute("/game")({
  head: () => ({
    meta: [
      { title: "Antipode Guessing Game — Can You Find Where the Drill Comes Out?" },
      {
        name: "description",
        content:
          "A mystery city drills through Earth — can you guess the antipodal point on the other side? Place your pin on the map, score points for accuracy, and earn a title: Earth Whisperer, Master Navigator, or Flat Earther.",
      },
      { property: "og:title", content: "Antipode Guessing Game — Where Does the Drill Come Out?" },
      {
        property: "og:description",
        content:
          "A mystery city drills straight through Earth. Guess the antipodal exit point on an interactive map. Score 100% to become an Earth Whisperer.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: GAME_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Antipode Guessing Game" },
      {
        name: "twitter:description",
        content: "Guess where a drill through the Earth comes out. Place your pin. Earn a title.",
      },
      { name: "robots", content: "index, follow" },
      {
        name: "keywords",
        content:
          "antipode game, earth drill game, geography guessing game, antipodal point quiz, dig through earth game, geoguessr alternative, world geography game",
      },
    ],
    links: [{ rel: "canonical", href: GAME_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Game",
          name: "Antipode Guessing Game",
          url: GAME_URL,
          description:
            "An interactive geography game where a random world city drills through the Earth and players must guess the antipodal exit point on an interactive map. Players earn titles based on accuracy: Earth Whisperer, Master Navigator, Seasoned Explorer, Frequent Flyer, Lost at Sea, or Flat Earther.",
          genre: "Geography / Educational",
          playMode: "SinglePlayer",
          applicationCategory: "Game",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          educationalUse: "Geography",
          typicalAgeRange: "10-",
        }),
      },
    ],
  }),
  component: GamePage,
});

function pickRandomCity() {
  return GAME_CITIES[Math.floor(Math.random() * GAME_CITIES.length)]!;
}

// ── Component ─────────────────────────────────────────────────────────────────

function GamePage() {
  const [phase, setPhase] = useState<Phase>("drilling");
  const [origin, setOrigin] = useState(() => pickRandomCity());
  const [guess, setGuess] = useState<Point | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const originPoint: Point = { lat: origin.lat, lng: origin.lng };
  const actualAntipode = antipode(originPoint);

  const distKm = guess ? haversineKm(guess, actualAntipode) : 0;
  const pct = scorePercent(distKm);
  const tier = scoreTier(pct);

  const handleDrillDone = useCallback(() => {
    setPhase("guessing");
  }, []);

  const handleConfirm = () => {
    if (!guess) return;
    setConfirmed(true);
    setPhase("result");
  };

  const handlePlayAgain = () => {
    setOrigin(pickRandomCity());
    setGuess(null);
    setConfirmed(false);
    setPhase("drilling");
  };

  // Line segments for result map (handles antimeridian crossing)
  const lineSegments: [number, number][][] = [];
  if (guess && confirmed) {
    const g: [number, number] = [guess.lat, guess.lng];
    const t: [number, number] = [actualAntipode.lat, actualAntipode.lng];
    const dLng = actualAntipode.lng - guess.lng;
    if (Math.abs(dLng) > 180) {
      const midLat = (guess.lat + actualAntipode.lat) / 2;
      if (guess.lng > 0) {
        lineSegments.push([g, [midLat, 180]]);
        lineSegments.push([[midLat, -180], t]);
      } else {
        lineSegments.push([g, [midLat, -180]]);
        lineSegments.push([[midLat, 180], t]);
      }
    } else {
      lineSegments.push([g, t]);
    }
  }

  const mapStyles = `
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
  `;

  return (
    <main className="min-h-screen">
      {/* Drilling phase */}
      {phase === "drilling" && <DrillDescent onDone={handleDrillDone} />}

      {/* Guessing phase */}
      {phase === "guessing" && (
        <div className="flex flex-col" style={{ minHeight: "100vh" }}>
          {/* Top bar */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="mono-label text-primary">Antipode Guessing Game</p>
                <h1
                  className="mt-1 text-2xl text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  MYSTERY LOCATION drilled through Earth
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  📍 Click the map to place your guess — where did the drill come out?
                </p>
              </div>
              {guess && (
                <button
                  onClick={handleConfirm}
                  className="shrink-0 rounded-full border border-primary bg-primary px-6 py-2.5 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
                >
                  Confirm guess →
                </button>
              )}
            </div>
          </div>

          {/* Hint strip */}
          {!guess && (
            <div className="border-b border-border bg-muted/50 px-6 py-2">
              <p className="mx-auto max-w-6xl font-mono text-xs text-muted-foreground tracking-wider text-center">
                A famous city somewhere on Earth just drilled straight through. Mark where you think it came out on the other side.
              </p>
            </div>
          )}
          {guess && (
            <div className="border-b border-border bg-primary/5 px-6 py-2">
              <p className="mx-auto max-w-6xl font-mono text-xs text-primary tracking-wider text-center">
                Pin placed at {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}° — click "Confirm guess" when ready, or click the map to reposition.
              </p>
            </div>
          )}

          {/* Map */}
          <div className="relative flex-1" style={{ minHeight: "calc(100vh - 160px)" }}>
            <style>{mapStyles}</style>
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
              <ClickHandler onPick={setGuess} />

              {/* Placeholder "?" marker at center until user clicks */}
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

            {/* No-guess overlay hint */}
            {!guess && (
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-10" style={{ zIndex: 400 }}>
                <div className="rounded-full border border-primary/30 bg-background/80 px-5 py-2 font-mono text-xs tracking-widest text-primary/70 backdrop-blur-sm uppercase">
                  Click anywhere on the map to place your guess
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && guess && (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <div className="border-b border-border bg-card px-6 py-5">
            <div className="mx-auto max-w-6xl">
              <p className="mono-label text-primary">Results</p>
              <h1
                className="mt-1 text-3xl text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                The drill has surfaced
              </h1>
            </div>
          </div>

          {/* Split layout */}
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Score card */}
              <div className="flex flex-col gap-5">
                {/* Badge */}
                <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
                  <div className="text-center">
                    <div style={{ fontSize: "4rem", lineHeight: 1 }}>{tier.emoji}</div>
                    <div
                      className="mt-3 text-4xl text-foreground"
                      style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                    >
                      {Math.round(pct)}%
                    </div>
                    <div
                      className="mt-1 text-xl text-primary"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {tier.title}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground italic">"{tier.oneliner}"</p>
                  </div>

                  {/* Score bar */}
                  <div className="mt-6">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "var(--primary)" : pct >= 40 ? "var(--accent)" : "var(--destructive)",
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                {/* Distance card */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="mono-label text-muted-foreground">Distance from actual antipode</p>
                  <p
                    className="mt-2 text-3xl text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {Math.round(distKm).toLocaleString()}
                    <span className="ml-1.5 text-base text-muted-foreground">km</span>
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Actual antipode: {actualAntipode.lat.toFixed(3)}°, {actualAntipode.lng.toFixed(3)}°
                  </p>
                </div>

                {/* Origin reveal */}
                <div className="rounded-xl border border-primary/30 bg-card p-5 shadow-sm">
                  <p className="mono-label text-primary">Mystery origin revealed</p>
                  <p
                    className="mt-2 text-2xl font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {origin.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {origin.lat.toFixed(4)}°, {origin.lng.toFixed(4)}°
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Drilled straight through the Earth's core to the other side.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 rounded-full border border-primary bg-primary px-5 py-2.5 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
                  >
                    🎲 Play again
                  </button>
                  <Link
                    to="/"
                    className="flex-1 rounded-full border border-border bg-background px-5 py-2.5 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary text-center"
                  >
                    Back to drill
                  </Link>
                </div>
              </div>

              {/* Result map */}
              <div className="overflow-hidden rounded-xl border border-border shadow-sm" style={{ minHeight: 480 }}>
                <style>{mapStyles}</style>
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

                  <FitBothPoints a={guess} b={actualAntipode} />

                  {/* Guess pin — yellow */}
                  <Marker position={[guess.lat, guess.lng]} icon={pulseIcon("#f59e0b")}>
                    <Popup>
                      <strong>Your guess</strong><br />
                      {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}°
                    </Popup>
                  </Marker>

                  {/* Actual antipode — red */}
                  <Marker position={[actualAntipode.lat, actualAntipode.lng]} icon={pulseIcon("#ef4444")}>
                    <Popup>
                      <strong>Actual antipode of {origin.name}</strong><br />
                      {actualAntipode.lat.toFixed(3)}°, {actualAntipode.lng.toFixed(3)}°
                    </Popup>
                  </Marker>

                  {/* Line */}
                  {lineSegments.map((seg, i) => (
                    <Polyline
                      key={i}
                      positions={seg}
                      pathOptions={{
                        color: "#ef4444",
                        weight: 2,
                        opacity: 0.6,
                        dashArray: "6 6",
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
