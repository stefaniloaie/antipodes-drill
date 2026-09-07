import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState, lazy, Suspense } from "react";
import ClientOnly from "@/components/ClientOnly";
import DrillDescent from "@/components/DrillDescent";
import { antipode, type Point } from "@/lib/geo";

// Lazy-load Leaflet maps — avoids SSR "window is not defined" crash
const LazyPickMap = lazy(() =>
  import("@/components/GameMap").then((m) => ({ default: m.PickMap })),
);
const LazyGuessMap = lazy(() =>
  import("@/components/GameMap").then((m) => ({ default: m.GuessMap })),
);
const LazyResultMap = lazy(() =>
  import("@/components/GameMap").then((m) => ({ default: m.ResultMap })),
);

// ── Haversine ──────────────────────────────────────────────────────────────────

function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function scorePercent(distKm: number): number {
  return Math.max(0, Math.min(100, 100 - distKm / 200));
}

// ── Cities ─────────────────────────────────────────────────────────────────────

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

// ── Score tiers ────────────────────────────────────────────────────────────────

type Tier = { emoji: string; title: string; oneliner: string };

function scoreTier(pct: number): Tier {
  if (pct >= 95)
    return {
      emoji: "🌍",
      title: "Earth Whisperer",
      oneliner: "You could feel the magma cooling on your fingertips.",
    };
  if (pct >= 80)
    return {
      emoji: "🧭",
      title: "Master Navigator",
      oneliner: "GPS would be proud. Very, very proud.",
    };
  if (pct >= 60)
    return {
      emoji: "🗺️",
      title: "Seasoned Explorer",
      oneliner: "Close enough to smell the ocean — or the soil.",
    };
  if (pct >= 40)
    return {
      emoji: "✈️",
      title: "Frequent Flyer",
      oneliner: "You've been around the world, just not quite through it.",
    };
  if (pct >= 20)
    return {
      emoji: "🚢",
      title: "Lost at Sea",
      oneliner: "Somewhere on Earth. Technically correct is the best kind of correct.",
    };
  return {
    emoji: "🪨",
    title: "Flat Earther",
    oneliner: "The drill came out where it wanted, not where you thought.",
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = "picking" | "drilling" | "guessing" | "result";

// ── Route ──────────────────────────────────────────────────────────────────────

const GAME_URL = "https://earthdrillexplorer.com/game";
const OG_IMAGE_URL = "https://earthdrillexplorer.com/og-earth-drill.jpg";

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
      { property: "og:site_name", content: "Antipodes Earth Drill" },
      { property: "og:url", content: GAME_URL },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:secure_url", content: OG_IMAGE_URL },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Antipode Guessing Game — Interactive Earth Drill",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Antipode Guessing Game" },
      {
        name: "twitter:description",
        content: "Guess where a drill through the Earth comes out. Place your pin. Earn a title.",
      },
      { name: "twitter:image", content: OG_IMAGE_URL },
      {
        name: "twitter:image:alt",
        content: "Antipode Guessing Game — Interactive Earth Drill",
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
          image: OG_IMAGE_URL,
          description:
            "An interactive geography game where a random world city drills through the Earth and players must guess the antipodal exit point on an interactive map.",
          genre: "Geography / Educational",
          playMode: "SinglePlayer",
          applicationCategory: "Game",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          educationalUse: "Geography",
          typicalAgeRange: "10-",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Earth Drill Map",
              item: "https://earthdrillexplorer.com/",
            },
            { "@type": "ListItem", position: 2, name: "Antipode Guessing Game", item: GAME_URL },
          ],
        }),
      },

    ],
  }),
  component: GamePage,
});

function pickRandomCity() {
  return GAME_CITIES[Math.floor(Math.random() * GAME_CITIES.length)]!;
}

const MapFallback = (
  <div
    className="flex flex-1 items-center justify-center"
    style={{ minHeight: "calc(100vh - 160px)" }}
  >
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────────

function GamePage() {
  const [phase, setPhase] = useState<Phase>("picking");
  const [origin, setOrigin] = useState(() => pickRandomCity());
  const [guess, setGuess] = useState<Point | null>(null);

  const originPoint: Point = { lat: origin.lat, lng: origin.lng };
  const actualAntipode = antipode(originPoint);

  const distKm = guess ? haversineKm(guess, actualAntipode) : 0;
  const pct = scorePercent(distKm);
  const tier = scoreTier(pct);

  const handleDrillDone = useCallback(() => setPhase("guessing"), []);

  const handleConfirm = () => {
    if (!guess) return;
    setPhase("result");
  };

  const handlePlayAgain = () => {
    setOrigin(pickRandomCity());
    setGuess(null);
    setPhase("picking");
  };

  return (
    <main className="min-h-screen">
      {/* Picking phase — user clicks the map to set drill origin */}
      {phase === "picking" && (
        <div className="flex min-h-screen flex-col">
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="mono-label text-primary">Antipode Guessing Game</p>
                <h1
                  className="mt-1 text-2xl text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Click anywhere to set your drill site
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a location — the drill will punch through Earth's core and you guess where it
                  comes out.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    setOrigin(pickRandomCity());
                    setGuess(null);
                    setPhase("drilling");
                  }}
                  className="rounded-full border border-border bg-background px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  🎲 Random
                </button>
                <Link
                  to="/"
                  search={{}}
                  className="rounded-full border border-border bg-background px-4 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  ← Back
                </Link>
              </div>
            </div>
          </div>
          <ClientOnly fallback={MapFallback}>
            {() => (
              <Suspense fallback={MapFallback}>
                <LazyPickMap
                  onPick={(p) => {
                    setOrigin({
                      name: `${p.lat.toFixed(2)}°, ${p.lng.toFixed(2)}°`,
                      lat: p.lat,
                      lng: p.lng,
                    });
                    setGuess(null);
                    setPhase("drilling");
                  }}
                />
              </Suspense>
            )}
          </ClientOnly>
        </div>
      )}

      {/* Drilling phase */}
      {phase === "drilling" && <DrillDescent onDone={handleDrillDone} />}

      {/* Guessing phase */}
      {phase === "guessing" && (
        <div className="flex flex-col" style={{ minHeight: "100vh" }}>
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

          {!guess && (
            <div className="border-b border-border bg-muted/50 px-6 py-2">
              <p className="mx-auto max-w-6xl text-center font-mono text-xs tracking-wider text-muted-foreground">
                A famous city somewhere on Earth just drilled straight through. Mark where you think
                it came out.
              </p>
            </div>
          )}
          {guess && (
            <div className="border-b border-border bg-primary/5 px-6 py-2">
              <p className="mx-auto max-w-6xl text-center font-mono text-xs tracking-wider text-primary">
                Pin at {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}° — click "Confirm guess" or
                reposition.
              </p>
            </div>
          )}

          <ClientOnly fallback={MapFallback}>
            {() => (
              <Suspense fallback={MapFallback}>
                <LazyGuessMap guess={guess} onPick={setGuess} />
              </Suspense>
            )}
          </ClientOnly>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && guess && (
        <div className="min-h-screen bg-background">
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

          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Score card */}
              <div className="flex flex-col gap-5">
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
                    <p className="mt-3 text-sm italic text-muted-foreground">"{tier.oneliner}"</p>
                  </div>
                  <div className="mt-6">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 80
                              ? "var(--primary)"
                              : pct >= 40
                                ? "var(--accent)"
                                : "var(--destructive)",
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

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
                    Actual antipode: {actualAntipode.lat.toFixed(3)}°,{" "}
                    {actualAntipode.lng.toFixed(3)}°
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <p className="mono-label text-muted-foreground">Your guess</p>
                  <p className="mt-2 font-mono text-sm text-foreground">
                    {guess.lat.toFixed(3)}°, {guess.lng.toFixed(3)}°
                  </p>
                </div>

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

                <div className="flex gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 rounded-full border border-primary bg-primary px-5 py-2.5 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
                  >
                    🎲 Play again
                  </button>
                  <Link
                    to="/"
                    search={{}}
                    className="flex-1 rounded-full border border-border bg-background px-5 py-2.5 text-center font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Back to drill
                  </Link>
                </div>
              </div>

              {/* Result map */}
              <ClientOnly
                fallback={
                  <div
                    className="flex items-center justify-center rounded-xl border border-border"
                    style={{ minHeight: 480 }}
                  >
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                {() => (
                  <Suspense
                    fallback={
                      <div
                        className="flex items-center justify-center rounded-xl border border-border"
                        style={{ minHeight: 480 }}
                      >
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    }
                  >
                    <LazyResultMap guess={guess} actual={actualAntipode} originName={origin.name} />
                  </Suspense>
                )}
              </ClientOnly>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
