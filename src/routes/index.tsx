import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import AntipodeMap from "@/components/AntipodeMap";
import DrillDescent from "@/components/DrillDescent";
import { antipode, describe, formatCoord, type Point, type Verdict } from "@/lib/geo";
import AdSlot from "@/components/AdSlot";
import { trackEvent } from "@/lib/analytics";

const SITE_URL = "https://antipodes-drill.lovable.app/";

export const Route = createFileRoute("/")({
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
      { name: "keywords", content: "antipode calculator, dig through earth, antipodal point, what is on the other side of earth, drill through earth, earth antipodes map" },
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


function Index() {
  const [origin, setOrigin] = useState<Point | null>(null);
  const [target, setTarget] = useState<Point | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [originName, setOriginName] = useState<string>("");
  const [drilling, setDrilling] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const drill = useCallback((p: Point, name?: string) => {
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
  }, []);

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
                  const text = `I drilled from ${label ?? originName} and surfaced at ${verdict.place} (${formatCoord(target)})`;
                  navigator.clipboard?.writeText(text);
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
