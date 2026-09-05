import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import AntipodeMap from "@/components/AntipodeMap";
import DrillDescent from "@/components/DrillDescent";
import { antipode, describe, formatCoord, type Point, type Verdict } from "@/lib/geo";
import AdSlot from "@/components/AdSlot";
import { trackEvent } from "@/lib/analytics";

const SITE_URL = "https://antipodes-drill.lovable.app/";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { lat?: number; lng?: number } => {
    const result: { lat?: number; lng?: number } = {};
    if (search["lat"] !== undefined) result.lat = Number(search["lat"]);
    if (search["lng"] !== undefined) result.lng = Number(search["lng"]);
    return result;
  },
  head: () => ({
    meta: [
      { title: "Antipodes Drill — Where Do You Come Out Digging Through Earth?" },
      {
        name: "description",
        content:
          "Click anywhere on Earth and drill 12,742 km straight through crust, mantle and 5,400 °C core. Find your antipodal point instantly — it's almost always ocean, not China.",
      },
      { property: "og:title", content: "Antipodes Drill — Dig Straight Through Earth" },
      {
        property: "og:description",
        content:
          "Drop a drill anywhere on the map and watch it punch through Earth's five layers to your antipodal point. Almost never China.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "antipode calculator, dig through earth, antipodal point, what is on the other side of earth, drill through earth, earth antipodes map, antipode guessing game, geography game" },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Antipodes Earth Drill",
          url: SITE_URL,
          description: "Interactive antipode calculator — click any point on Earth to find the exact location on the opposite side of the globe, animated with a drill descent through Earth's layers.",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "Interactive world map with click-to-drill",
            "Animated drill descent through Earth's layers",
            "Interactive 3D globe with drag and zoom",
            "Country and ocean identification",
            "Real geological layer data",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is an antipode?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "An antipode is the point on Earth's surface directly opposite another point — the place you'd emerge if you dug straight through the planet's center. Antipodal coordinates are simply the negation of latitude and the longitude shifted by 180°.",
              },
            },
            {
              "@type": "Question",
              name: "If you dig through Earth from the US, where do you come out?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Digging straight through Earth from anywhere in the continental US would land you in the Indian Ocean, south of Australia. China is not antipodal to the US — that's a myth.",
              },
            },
            {
              "@type": "Question",
              name: "Is it true that digging from China brings you to the US?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Both China and the US are in the northern hemisphere. China's antipode is in the South Atlantic Ocean near Argentina. The antipode of mainland USA is the Indian Ocean.",
              },
            },
            {
              "@type": "Question",
              name: "How deep is the Earth?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Earth's diameter is 12,742 km. A straight drill from surface to surface passes through the crust (~35 km), upper mantle (to 660 km), lower mantle (to 2,890 km), liquid outer core (to 5,150 km), and solid inner core at ~5,400 °C.",
              },
            },
            {
              "@type": "Question",
              name: "Which countries have land-to-land antipodes?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Very few country pairs are land-to-land antipodal. The most notable: Spain and New Zealand, Argentina and China (roughly), and some Pacific island nations. Over 90% of all land is antipodal to ocean.",
              },
            },
            {
              "@type": "Question",
              name: "What is the antipode of London?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The antipode of London (51.5°N, 0.1°W) is approximately 51.5°S, 179.9°E — in the South Pacific Ocean, about 2,000 km east of New Zealand. Not China.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

// ── Data ──────────────────────────────────────────────────────────────────────

const FAMOUS_PAIRS = [
  {
    cityA: "Madrid",
    lat: 40.4168,
    lng: -3.7038,
    cityB: "Wellington, NZ",
    fact: "One of the rare land-to-land antipodal pairs on Earth — Iberia and Aotearoa mirror each other.",
  },
  {
    cityA: "Buenos Aires",
    lat: -34.6037,
    lng: -58.3816,
    cityB: "Shanghai area, China",
    fact: "Argentina's capital drills to East China — the only major Southern-Hemisphere-to-China pairing.",
  },
  {
    cityA: "Auckland",
    lat: -36.8509,
    lng: 174.7645,
    cityB: "Seville, Spain",
    fact: "New Zealand and Spain are near-perfect antipodal mirrors — half a world apart, both temperate.",
  },
  {
    cityA: "Taipei",
    lat: 25.033,
    lng: 121.5654,
    cityB: "Paraguay",
    fact: "Taiwan's capital emerges in landlocked South America, near the Paraguayan Chaco.",
  },
  {
    cityA: "Perth",
    lat: -31.9505,
    lng: 115.8605,
    cityB: "Bermuda area",
    fact: "Western Australia's sunniest city punches through to the North Atlantic near Bermuda.",
  },
  {
    cityA: "London",
    lat: 51.5074,
    lng: -0.1278,
    cityB: "South Pacific (NZ waters)",
    fact: "Big Ben digs to empty ocean ~2,000 km east of New Zealand. Definitely not China.",
  },
  {
    cityA: "Tokyo",
    lat: 35.6762,
    lng: 139.6503,
    cityB: "Uruguay coast",
    fact: "Japan's capital surfaces just off the Atlantic coast of Uruguay — a stunning jump.",
  },
  {
    cityA: "New York",
    lat: 40.7128,
    lng: -74.006,
    cityB: "South Indian Ocean",
    fact: "NYC digs to empty ocean south of Western Australia. China is nowhere near the antipode.",
  },
] as const;

const RANDOM_CITIES = [
  { label: "London", lat: 51.5074, lng: -0.1278 },
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
  { label: "Cairo", lat: 30.0444, lng: 31.2357 },
  { label: "Mumbai", lat: 19.076, lng: 72.8777 },
  { label: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { label: "Beijing", lat: 39.9042, lng: 116.4074 },
  { label: "Moscow", lat: 55.7558, lng: 37.6176 },
  { label: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { label: "Lagos", lat: 6.5244, lng: 3.3792 },
  { label: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { label: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { label: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { label: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { label: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { label: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { label: "Seoul", lat: 37.5665, lng: 126.978 },
  { label: "Madrid", lat: 40.4168, lng: -3.7038 },
  { label: "Wellington", lat: -41.2865, lng: 174.7762 },
];

const COUNTRY_TABLE = [
  { country: "Afghanistan", capital: "Kabul", lat: 34.5553, lng: 69.2075, antipodeLoc: "South Pacific Ocean" },
  { country: "Argentina", capital: "Buenos Aires", lat: -34.6037, lng: -58.3816, antipodeLoc: "Shanghai area, China" },
  { country: "Australia", capital: "Canberra", lat: -35.2809, lng: 149.13, antipodeLoc: "North Atlantic Ocean" },
  { country: "Brazil", capital: "Brasília", lat: -15.7942, lng: -47.8822, antipodeLoc: "Philippine Sea" },
  { country: "Canada", capital: "Ottawa", lat: 45.4215, lng: -75.6972, antipodeLoc: "South Indian Ocean" },
  { country: "Chile", capital: "Santiago", lat: -33.4489, lng: -70.6693, antipodeLoc: "Yellow Sea (China coast)" },
  { country: "China", capital: "Beijing", lat: 39.9042, lng: 116.4074, antipodeLoc: "South Atlantic Ocean (Argentina)" },
  { country: "Colombia", capital: "Bogotá", lat: 4.711, lng: -74.0721, antipodeLoc: "Indian Ocean (off Indonesia)" },
  { country: "Denmark", capital: "Copenhagen", lat: 55.6761, lng: 12.5683, antipodeLoc: "South Pacific Ocean" },
  { country: "Egypt", capital: "Cairo", lat: 30.0444, lng: 31.2357, antipodeLoc: "South Pacific Ocean" },
  { country: "France", capital: "Paris", lat: 48.8566, lng: 2.3522, antipodeLoc: "South Pacific Ocean (near NZ)" },
  { country: "Germany", capital: "Berlin", lat: 52.52, lng: 13.405, antipodeLoc: "South Pacific Ocean" },
  { country: "Greece", capital: "Athens", lat: 37.9838, lng: 23.7275, antipodeLoc: "South Pacific Ocean" },
  { country: "India", capital: "New Delhi", lat: 28.6139, lng: 77.209, antipodeLoc: "South Pacific Ocean" },
  { country: "Indonesia", capital: "Jakarta", lat: -6.2088, lng: 106.8456, antipodeLoc: "Pacific Ocean (near Ecuador)" },
  { country: "Iran", capital: "Tehran", lat: 35.6892, lng: 51.389, antipodeLoc: "South Pacific Ocean" },
  { country: "Italy", capital: "Rome", lat: 41.9028, lng: 12.4964, antipodeLoc: "South Pacific Ocean" },
  { country: "Japan", capital: "Tokyo", lat: 35.6762, lng: 139.6503, antipodeLoc: "South Atlantic (Uruguay coast)" },
  { country: "Kenya", capital: "Nairobi", lat: -1.2921, lng: 36.8219, antipodeLoc: "Pacific Ocean (north of Kiribati)" },
  { country: "Mexico", capital: "Mexico City", lat: 19.4326, lng: -99.1332, antipodeLoc: "South Indian Ocean" },
  { country: "Netherlands", capital: "Amsterdam", lat: 52.3676, lng: 4.9041, antipodeLoc: "South Pacific Ocean" },
  { country: "New Zealand", capital: "Wellington", lat: -41.2865, lng: 174.7762, antipodeLoc: "Spain / Atlantic coast" },
  { country: "Nigeria", capital: "Abuja", lat: 9.0579, lng: 7.4951, antipodeLoc: "South Pacific Ocean" },
  { country: "Norway", capital: "Oslo", lat: 59.9139, lng: 10.7522, antipodeLoc: "South Pacific Ocean" },
  { country: "Pakistan", capital: "Islamabad", lat: 33.6844, lng: 73.0479, antipodeLoc: "South Pacific Ocean" },
  { country: "Peru", capital: "Lima", lat: -12.0464, lng: -77.0428, antipodeLoc: "South China Sea / Gulf of Thailand" },
  { country: "Philippines", capital: "Manila", lat: 14.5995, lng: 120.9842, antipodeLoc: "Bolivia / Brazil border" },
  { country: "Poland", capital: "Warsaw", lat: 52.2297, lng: 21.0122, antipodeLoc: "South Pacific Ocean" },
  { country: "Portugal", capital: "Lisbon", lat: 38.7223, lng: -9.1393, antipodeLoc: "South Pacific Ocean (near NZ)" },
  { country: "Russia", capital: "Moscow", lat: 55.7558, lng: 37.6176, antipodeLoc: "South Pacific Ocean" },
  { country: "Saudi Arabia", capital: "Riyadh", lat: 24.6877, lng: 46.7219, antipodeLoc: "South Pacific Ocean" },
  { country: "South Africa", capital: "Pretoria", lat: -25.7479, lng: 28.2293, antipodeLoc: "North Pacific Ocean (west of Hawaii)" },
  { country: "South Korea", capital: "Seoul", lat: 37.5665, lng: 126.978, antipodeLoc: "South Atlantic Ocean (Argentina)" },
  { country: "Spain", capital: "Madrid", lat: 40.4168, lng: -3.7038, antipodeLoc: "Wellington, New Zealand (land!)" },
  { country: "Sweden", capital: "Stockholm", lat: 59.3293, lng: 18.0686, antipodeLoc: "South Pacific Ocean" },
  { country: "Thailand", capital: "Bangkok", lat: 13.7563, lng: 100.5018, antipodeLoc: "Pacific coast of Peru" },
  { country: "Turkey", capital: "Ankara", lat: 39.9334, lng: 32.8597, antipodeLoc: "South Pacific Ocean" },
  { country: "Ukraine", capital: "Kyiv", lat: 50.4501, lng: 30.5234, antipodeLoc: "South Pacific Ocean" },
  { country: "United Kingdom", capital: "London", lat: 51.5074, lng: -0.1278, antipodeLoc: "South Pacific Ocean (near NZ)" },
  { country: "United States", capital: "Washington DC", lat: 38.9072, lng: -77.0369, antipodeLoc: "South Indian Ocean" },
  { country: "Vietnam", capital: "Hanoi", lat: 21.0285, lng: 105.8542, antipodeLoc: "South Pacific Ocean" },
];

// ── Component ─────────────────────────────────────────────────────────────────

function Index() {
  const { lat: searchLat, lng: searchLng } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const didAutodrillRef = useRef(false);

  const [origin, setOrigin] = useState<Point | null>(null);
  const [target, setTarget] = useState<Point | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [originName, setOriginName] = useState<string>("");
  const [drilling, setDrilling] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const drill = useCallback(
    (p: Point, name?: string) => {
      const t = antipode(p);
      trackEvent("select_location", {
        method: name ? "preset" : "map_click",
        location_name: name ?? describe(p).place,
        origin_lat: Number(p.lat.toFixed(3)),
        origin_lng: Number(p.lng.toFixed(3)),
      });
      trackEvent("start_drill", {
        origin_lat: Number(p.lat.toFixed(3)),
        origin_lng: Number(p.lng.toFixed(3)),
        target_lat: Number(t.lat.toFixed(3)),
        target_lng: Number(t.lng.toFixed(3)),
      });
      setOrigin(p);
      setTarget(t);
      setVerdict(null);
      setLabel(name ?? null);
      setOriginName(describe(p).place);
      setDrilling(true);
      navigate({ search: { lat: p.lat, lng: p.lng }, replace: true });
    },
    [navigate],
  );

  const finish = useCallback(() => {
    setDrilling(false);
    if (!target) return;
    const v = describe(target);
    setVerdict(v);
    trackEvent("drill_complete", {
      emerged_on: v.isLand ? "land" : "ocean",
      place: v.place,
      target_lat: Number(target.lat.toFixed(3)),
      target_lng: Number(target.lng.toFixed(3)),
    });
  }, [target]);

  // Auto-drill from URL params on first mount
  useEffect(() => {
    if (didAutodrillRef.current) return;
    if (
      searchLat !== undefined &&
      searchLng !== undefined &&
      !isNaN(searchLat) &&
      !isNaN(searchLng)
    ) {
      didAutodrillRef.current = true;
      drill({ lat: searchLat, lng: searchLng });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRandom = () => {
    const idx = Math.floor(Math.random() * RANDOM_CITIES.length);
    const city = RANDOM_CITIES[idx];
    if (!city) return;
    drill({ lat: city.lat, lng: city.lng }, city.label);
  };

  return (
    <main className="min-h-screen">
      {drilling && <DrillDescent onDone={finish} />}

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 topo opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-muted/50" />
        <div className="absolute inset-0 grain opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-14 sm:pt-20">
          <p className="mono-label text-primary">12 742 km · straight down · no detours</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[0.95] text-foreground sm:text-6xl">
            Dig a hole to the
            <span className="block text-primary">other side of Earth.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            You were told it comes out in China. It almost never does — click the map to find out
            where you'd actually surface.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRandom}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              🎲 Random
            </button>
            <Link
              to="/game"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
            >
              🎮 Play the guessing game
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pt-6">
        <AdSlot slot="" label="Advertisement" minHeight={90} />
      </div>

      {/* Main: full-width map */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <AntipodeMap onDrill={drill} origin={origin} target={target} />
      </section>

      {/* Result panel — shown after drill */}
      {verdict && origin && target && (
        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Origin */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="mono-label text-muted-foreground">You drilled from</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{label ?? originName}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{formatCoord(origin)}</p>
            </div>

            {/* Target */}
            <div className="rounded-xl border border-primary/40 bg-card p-5 shadow-sm">
              <p className="mono-label text-primary">You surface at</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{verdict.place}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{formatCoord(target)}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {verdict.isLand
                  ? "Rare hit — dry land. Only ~10% of land antipodes manage this."
                  : "Splash. ~90% of all land antipodes open into open ocean."}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                  trackEvent("share_antipode_result", {
                    method: "copy_link",
                    emerged_on: verdict.isLand ? "land" : "ocean",
                    place: verdict.place,
                  });
                }}
                className="mt-4 rounded-full border border-border bg-background px-4 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {copied ? "✓ Copied" : "Copy result"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Famous antipodal pairs */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mono-label text-primary">Explore</p>
          <h2 className="mt-3 text-3xl text-foreground">Famous antipodal pairs</h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Click any card to drill from that city and see where it surfaces.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FAMOUS_PAIRS.map((pair) => (
              <button
                key={pair.cityA}
                onClick={() => drill({ lat: pair.lat, lng: pair.lng }, pair.cityA)}
                className="group rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-md"
              >
                <p className="font-mono text-xs text-primary uppercase tracking-wider">Drill from</p>
                <p className="mt-1 text-base font-semibold text-foreground group-hover:text-primary">
                  {pair.cityA}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">→ {pair.cityB}</p>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{pair.fact}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* About / How it works — needed for AdSense content review */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="mono-label text-primary">About</p>
              <h2 className="mt-3 text-3xl text-foreground">What is an antipodal point?</h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                An <strong className="text-foreground">antipodal point</strong> is the location on Earth's surface
                that is diametrically opposite to a given point — the place you'd emerge if you could drill a
                perfectly straight tunnel through the center of the Earth. The word comes from the Greek
                <em> antipodes</em>, meaning "with feet opposite."
              </p>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                Calculating your antipode is straightforward geometry: negate your latitude and shift your
                longitude by 180°. If you stand at 40°N, 74°W (New York City), your antipode is at
                40°S, 106°E — deep in the southern Indian Ocean, roughly 1,500 km south of Western Australia.
              </p>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                The surprising fact: <strong className="text-foreground">over 71% of Earth's surface is ocean</strong>,
                and the distribution of land vs ocean is highly asymmetric between hemispheres. The northern
                hemisphere holds most of the world's landmass, while the southern hemisphere is predominantly
                water. This means the antipode of almost any city you can name drops into open ocean.
              </p>
            </div>
            <div>
              <p className="mono-label text-primary">The China myth</p>
              <h2 className="mt-3 text-3xl text-foreground">Why digging doesn't reach China</h2>
              <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                The "dig to China" idiom is deeply embedded in English-speaking culture, but it's
                geographically impossible for anyone in the United States or Europe. China sits at
                roughly 20–50°N latitude, in the same hemisphere as both countries.
              </p>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                The antipode of New York (40.7°N, 74°W) is the Indian Ocean at 40.7°S, 106°E. The
                antipode of London (51.5°N, 0.1°W) is the South Pacific Ocean at 51.5°S, 179.9°E —
                about 2,000 km east of New Zealand. Neither is anywhere near China.
              </p>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                The only people for whom digging "toward China" makes geographic sense are those
                living in Argentina or Chile — whose antipodes do land in parts of East Asia.
                For everyone else, it's ocean all the way down.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earth layers explainer */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mono-label text-primary">Earth's layers</p>
          <h2 className="mt-3 text-3xl text-foreground">What your drill passes through</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Continental Crust", depth: "0–35 km", temp: "20–400 °C", note: "Rock you could hold. The thinnest skin on the planet.", color: "var(--crust)" },
              { name: "Upper Mantle", depth: "35–660 km", temp: "500–900 °C", note: "Solid rock that creeps like cold honey over millennia.", color: "var(--mantle-upper)" },
              { name: "Lower Mantle", depth: "660–2 890 km", temp: "900–3 700 °C", note: "Silicate under 1.3 million atmospheres of pressure.", color: "var(--mantle-lower)" },
              { name: "Outer Core", depth: "2 890–5 150 km", temp: "4 400–5 000 °C", note: "Liquid iron generating Earth's magnetic field.", color: "var(--outer-core)" },
              { name: "Inner Core", depth: "5 150–6 371 km", temp: "≈ 5 400 °C", note: "A solid iron ball as hot as the surface of the Sun.", color: "var(--inner-core)" },
            ].map((l) => (
              <div key={l.name} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 h-1 w-full rounded-full" style={{ background: l.color }} />
                <p className="font-display text-sm font-semibold text-foreground">{l.name}</p>
                <p className="mono-label mt-1 text-primary">{l.temp}</p>
                <p className="mono-label mt-0.5 text-muted-foreground">{l.depth}</p>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{l.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mono-label text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl text-foreground">Common questions</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { q: "What is an antipode?", a: "An antipode is the point on Earth directly opposite any given location. Mathematically: negate the latitude and shift the longitude by 180°. If you're at 51°N, 0°E (London), your antipode is 51°S, 180°W — in the Pacific Ocean south of New Zealand." },
              { q: "If I dig from the US, where do I come out?", a: "Anywhere in the continental United States lands in the Indian Ocean, south of the Kerguelen Islands. None of it is near China. Both the US and China are in the northern hemisphere — so neither is the other's antipode." },
              { q: "Is the 'dig to China' myth true?", a: "No. China's antipodal region is mostly South Atlantic Ocean, near Argentina. Digging from the UK lands somewhere between New Zealand and Antarctica, not Asia." },
              { q: "What percentage of land antipodes are ocean?", a: "Over 90% of the Earth's land surface is antipodal to open ocean. Land-to-land antipodal pairs are rare: New Zealand / Spain, Argentina / China, and a few island pairs are the classic examples." },
              { q: "How hot is the Earth's core?", a: "The inner core is approximately 5,400 °C — comparable to the surface temperature of the Sun. The outer core is 4,400–5,000 °C and liquid. Pressure at the center reaches 360 gigapascals, roughly 3.6 million times atmospheric pressure." },
              { q: "How does the antipode calculator work?", a: "The math is simple: antipode latitude = −latitude, antipode longitude = longitude ± 180°. Country detection uses the d3-geo geoContains function against the Natural Earth 110m dataset. Ocean naming uses geographic bounding boxes." },
            ].map((item) => (
              <div key={item.q} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold text-foreground">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Country antipode table */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="mono-label text-primary">Reference</p>
          <h2 className="mt-3 text-3xl text-foreground">Antipode of every country (capital city)</h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Where each capital city emerges after drilling straight through the Earth. Click "Drill →" to explore.
          </p>
          <div
            className="mt-8 overflow-hidden rounded-xl border border-border"
            style={{ maxHeight: 400, overflowY: "auto" }}
          >
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">Country</th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">Capital</th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">Antipode location</th>
                  <th className="px-4 py-3 text-right font-mono text-xs text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {COUNTRY_TABLE.map((row, i) => (
                  <tr
                    key={row.country}
                    className={i % 2 === 0 ? "bg-background" : "bg-card"}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{row.country}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.capital}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.antipodeLoc}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => drill({ lat: row.lat, lng: row.lng }, row.capital)}
                        className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Drill →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <AdSlot slot="" label="Advertisement" minHeight={120} />
      </div>

      <footer className="border-t border-border bg-card px-6 py-8">
        <p className="mx-auto max-w-6xl font-mono text-xs text-muted-foreground">
          Earth radius 6 371 km · core ≈ 5 400 °C · antipode = (−lat, lng ± 180°)
        </p>
      </footer>
    </main>
  );
}
