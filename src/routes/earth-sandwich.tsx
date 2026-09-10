import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import AdSlot from "@/components/AdSlot";
import { antipode, describe, formatCoord, type Point } from "@/lib/geo";

const PAGE_URL = "https://earthdrillexplorer.com/earth-sandwich";
const OG_IMAGE_URL = "https://earthdrillexplorer.com/og-earth-drill.jpg";

export const Route = createFileRoute("/earth-sandwich")({
  head: () => ({
    meta: [
      { title: "Earth Sandwich: Make One With Antipodal Bread" },
      {
        name: "description",
        content:
          "An Earth Sandwich needs two slices of bread at exact antipodal points. Over 90% of land faces open ocean, so valid pairs are rare. Check your coordinates and find your sandwich partner.",
      },
      { property: "og:title", content: "Earth Sandwich: Make One With Antipodal Bread" },
      {
        property: "og:description",
        content:
          "Two slices of bread, 12,742 km apart. Use the antipode checker to see where your second slice must land to make a real Earth Sandwich.",
      },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "Antipodes Earth Drill" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:secure_url", content: OG_IMAGE_URL },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Earth Sandwich challenge — antipodal bread placement on Antipodes Earth Drill",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
      {
        name: "twitter:image:alt",
        content: "Earth Sandwich challenge — antipodal bread placement on Antipodes Earth Drill",
      },
      { name: "robots", content: "index, follow" },
      {
        name: "keywords",
        content:
          "earth sandwich, earth sandwich challenge, antipodal points, opposite side of the world, antipode calculator, earth sandwich locations",
      },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Earth Sandwich: Make One With Antipodal Bread",
          description:
            "What the Earth Sandwich challenge is, why valid land-to-land pairs are so rare, and how to find your exact antipodal bread placement point.",
          image: OG_IMAGE_URL,
          url: PAGE_URL,
          mainEntityOfPage: PAGE_URL,
          author: { "@type": "Organization", name: "Antipodes Earth Drill" },
          publisher: {
            "@type": "Organization",
            name: "Antipodes Earth Drill",
            logo: { "@type": "ImageObject", url: OG_IMAGE_URL },
          },
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
            { "@type": "ListItem", position: 2, name: "Earth Sandwich Challenge", item: PAGE_URL },
          ],
        }),
      },
    ],
  }),
  component: EarthSandwich,
});

const PAIRS = [
  {
    sliceA: "Central & southern Spain",
    sliceB: "North Island, New Zealand",
    detail: "The classic pairing — Madrid and Wellington are almost antipodal.",
  },
  {
    sliceA: "Portugal",
    sliceB: "South Island, New Zealand",
    detail: "Lisbon's second slice lands near Christchurch.",
  },
  {
    sliceA: "Buenos Aires, Argentina",
    sliceB: "Eastern China",
    detail: "The Shanghai area — the only major city-to-city Earth Sandwich on Earth.",
  },
  {
    sliceA: "Central Chile",
    sliceB: "China (Shaanxi / Henan)",
    detail: "Santiago pairs with central China.",
  },
  {
    sliceA: "Taiwan",
    sliceB: "Paraguay",
    detail: "Taipei and Asunción sit almost exactly opposite each other.",
  },
  {
    sliceA: "Uruguay",
    sliceB: "Yellow Sea coast, China",
    detail: "Montevideo's bread lands just off the Chinese coast — check the tide.",
  },
];

const CHECK_CITIES = [
  { label: "London", lat: 51.5072, lng: -0.1276 },
  { label: "New York", lat: 40.7128, lng: -74.006 },
  { label: "Madrid", lat: 40.4168, lng: -3.7038 },
  { label: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { label: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { label: "Sydney", lat: -33.8688, lng: 151.2093 },
  { label: "Taipei", lat: 25.033, lng: 121.5654 },
  { label: "Paris", lat: 48.8566, lng: 2.3522 },
];

function SandwichChecker() {
  const [city, setCity] = useState(CHECK_CITIES[0]!);
  const [lat, setLat] = useState(String(CHECK_CITIES[0]!.lat));
  const [lng, setLng] = useState(String(CHECK_CITIES[0]!.lng));

  const result = useMemo(() => {
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      return null;
    }
    const point: Point = { lat: la, lng: lo };
    const anti = antipode(point);
    return { point, anti, verdict: describe(anti) };
  }, [lat, lng]);

  const pickCity = (c: (typeof CHECK_CITIES)[number]) => {
    setCity(c);
    setLat(String(c.lat));
    setLng(String(c.lng));
  };

  return (
    <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-wrap gap-2">
        {CHECK_CITIES.map((c) => (
          <button
            key={c.label}
            onClick={() => pickCity(c)}
            className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
              city.label === c.label
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Your latitude
          </span>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Your longitude
          </span>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      {result && (
        <div className="mt-5 rounded-lg border border-border bg-card p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Second slice goes at {formatCoord(result.anti)}
          </p>
          <p className="mt-2 text-base">
            {result.verdict.isLand ? (
              <span className="font-semibold text-primary">
                🥪 Sandwich confirmed — your partner's bread lands in{" "}
                {result.verdict.place}.
              </span>
            ) : (
              <span className="font-semibold text-destructive">
                🌊 Soggy bread — that's the {result.verdict.place}. Sandwich failed.
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.verdict.isLand
              ? "Rally a friend at those coordinates, drop both slices at the same moment, and you've made a 12,742 km sandwich."
              : "Try a different starting point — valid land-to-land pairs are rare, which is the whole point of the challenge."}
          </p>
          <div className="mt-4">
            <Link
              to="/"
              search={{}}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 font-mono text-xs text-primary-foreground transition-all hover:opacity-90"
            >
              ⛏ See this exact antipode on the drill map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function EarthSandwich() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 topo opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-muted/50" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-14 sm:pt-20">
          <p className="mono-label text-primary">The Earth Sandwich challenge</p>
          <h1 className="mt-3 text-4xl leading-[0.95] text-foreground sm:text-6xl">
            Make an Earth Sandwich:
            <span className="block text-primary">two slices, 12,742 km apart.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            An Earth Sandwich is simple: you and a friend each place a slice of bread on the ground
            at exact antipodal points — the two spots on Earth that are diametrically opposite.
            The catch? Over 90% of land sits opposite open ocean, so most attempts end with a
            floating slice.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#checker"
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
            >
              🥪 Check your bread spot
            </a>
            <Link
              to="/"
              search={{}}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ⛏ Visualize the antipode drill
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pt-6">
        <AdSlot slot="" label="Advertisement" minHeight={90} />
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="mono-label text-primary">The rules</p>
        <h2 className="mt-3 text-3xl text-foreground">How to make a real Earth Sandwich</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">Step 1</p>
            <p className="mt-2 text-base text-foreground">
              Find your <strong>antipode</strong> — the point exactly opposite you through the
              planet. Negate your latitude and shift your longitude by 180°.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">Step 2</p>
            <p className="mt-2 text-base text-foreground">
              Recruit a partner at that spot. Both points must be on <strong>land</strong> — an
              ocean slice doesn't count.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">Step 3</p>
            <p className="mt-2 text-base text-foreground">
              Both drop a slice of bread at the same moment. Congratulations: the filling is a
              12,742 km column of rock, magma and molten iron.
            </p>
          </div>
        </div>
      </section>

      {/* Checker */}
      <section id="checker" className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="mono-label text-primary">Antipode checker</p>
          <h2 className="mt-3 text-3xl text-foreground">Where does your second slice land?</h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Pick a city or enter your coordinates. We'll compute the exact antipodal point and tell
            you whether your Earth Sandwich holds together — or floats away.
          </p>
          <div className="mt-6">
            <SandwichChecker />
          </div>
        </div>
      </section>

      {/* Valid pairs */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="mono-label text-primary">The rare pairs</p>
          <h2 className="mt-3 text-3xl text-foreground">
            Where an Earth Sandwich is actually possible
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Because Earth's land is lopsided, only a handful of land-to-land antipodal pairs exist.
            These are the realistic launchpads for your sandwich.
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Slice one
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Slice two
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider sm:table-cell">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map((row, i) => (
                  <tr key={row.sliceA} className={i % 2 === 0 ? "bg-background" : "bg-card"}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.sliceA}</td>
                    <td className="px-4 py-3 text-primary font-medium">{row.sliceB}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Everyone else — North America, the UK, most of Europe, Japan, Australia — is antipodal
            to open ocean. That's the same geometry behind the{" "}
            <Link
              to="/dig-to-china"
              className="text-primary underline-offset-2 hover:underline"
            >
              myth of digging to China
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="rounded-xl border border-primary/40 bg-background p-6 shadow-sm">
            <p className="mono-label text-primary">See it, don't just read it</p>
            <p className="mt-3 text-base text-muted-foreground">
              Drop the drill on the interactive map and watch it descend through the crust, mantle
              and 5,400 °C core to your exact antipodal bread spot — then share the coordinates
              with your sandwich partner.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                search={{}}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
              >
                ⛏ Drill to your antipode
              </Link>
              <Link
                to="/game"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                🎮 Play the antipode guessing game
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-12">
        <AdSlot slot="" label="Advertisement" minHeight={120} />
      </div>

      <footer className="border-t border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            Earth radius 6 371 km · antipode = (−lat, lng ± 180°) · bread not included
          </p>
          <div className="flex gap-4 font-mono text-xs">
            <Link
              to="/"
              search={{}}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Earth Drill Map
            </Link>
            <Link
              to="/dig-to-china"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Digging to China?
            </Link>
            <Link to="/game" className="text-muted-foreground transition-colors hover:text-primary">
              Guessing Game
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
