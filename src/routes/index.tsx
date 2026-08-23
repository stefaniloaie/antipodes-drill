import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import WorldMap from "@/components/WorldMap";
import Globe from "@/components/Globe";
import DrillDescent from "@/components/DrillDescent";
import { antipode, describe, formatCoord, type Point, type Verdict } from "@/lib/geo";
import heroImage from "@/assets/earth-core-hero.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Antipodes Earth Drill — Dig Straight Through the Planet" },
      {
        name: "description",
        content:
          "Click anywhere on Earth and drill 12,742 km straight down through crust, mantle and a 5,000 °C core. See exactly where you pop out — usually empty ocean.",
      },
      { property: "og:title", content: "Antipodes Earth Drill — Dig Straight Through the Planet" },
      {
        property: "og:description",
        content:
          "Drop a drill anywhere on the map and watch it punch through Earth's core to your antipodal point.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PRESETS: { label: string; p: Point }[] = [
  { label: "London", p: { lat: 51.5072, lng: -0.1276 } },
  { label: "New York", p: { lat: 40.7128, lng: -74.006 } },
  { label: "Bucharest", p: { lat: 44.4268, lng: 26.1025 } },
  { label: "Madrid", p: { lat: 40.4168, lng: -3.7038 } },
  { label: "Tokyo", p: { lat: 35.6762, lng: 139.6503 } },
  { label: "Sydney", p: { lat: -33.8688, lng: 151.2093 } },
];

function Index() {
  const [origin, setOrigin] = useState<Point | null>(null);
  const [target, setTarget] = useState<Point | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [originName, setOriginName] = useState<string>("");
  const [drilling, setDrilling] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const drill = useCallback((p: Point, name?: string) => {
    const t = antipode(p);
    setOrigin(p);
    setTarget(t);
    setVerdict(null);
    setLabel(name ?? null);
    setOriginName(describe(p).place);
    setDrilling(true);
  }, []);

  const finish = useCallback(() => {
    setDrilling(false);
    if (target) setVerdict(describe(target));
  }, [target]);

  return (
    <main className="min-h-screen">
      {drilling && <DrillDescent onDone={finish} />}

      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="Cinematic cross-section of Earth showing crust, mantle and a glowing molten inner core with a drill shaft punching through"
          width={1920}
          height={1088}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        <div className="absolute inset-0 grain opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pt-24">
          <p className="mono-label text-primary">12 742 km · straight down · no detours</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)] sm:text-7xl">
            Dig a hole to the
            <span className="block text-primary">other side of Earth.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            You were told it comes out in China. It almost never does. Over 90% of land on this
            planet is antipodal to open ocean — click the map and find out where you'd actually
            surface.
          </p>
        </div>
      </section>


      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="mono-label text-muted-foreground">Click anywhere to drop the drill</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((x) => (
                <button
                  key={x.label}
                  onClick={() => drill(x.p, x.label)}
                  className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <WorldMap onPick={(p) => drill(p)} origin={origin} target={target} />
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          {!verdict && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="mono-label text-muted-foreground">Awaiting coordinates</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Pick a spot. The drill descends through five layers of Earth and re-emerges at your
                antipode.
              </p>
            </div>
          )}

          {verdict && origin && target && (
            <>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="mono-label text-muted-foreground">You dug from</p>
                <p className="mt-1 text-xl">{label ?? originName}</p>
                <p className="font-mono text-xs text-muted-foreground">{formatCoord(origin)}</p>

                <div className="my-5 h-px w-full bg-border" />

                <p className="mono-label text-primary">You surface at</p>
                <h2 className="mt-1 text-3xl leading-tight">{verdict.place}</h2>
                <p className="font-mono text-xs text-muted-foreground">{formatCoord(target)}</p>

                <p className="mt-5 text-sm text-muted-foreground">
                  {verdict.isLand
                    ? "Rare hit — you came out on dry land. Only a small fraction of Earth's surface manages that."
                    : "Splash. Like ~90% of land points, your tunnel opens into open water, thousands of kilometres from anyone."}
                </p>
              </div>

              <div className="flex flex-col items-center rounded-lg border border-border bg-card p-6">
                <p className="mono-label mb-3 self-start text-muted-foreground">
                  Exit point · globe view
                </p>
                <Globe target={target} />
              </div>
            </>
          )}

          <div className="rounded-lg border border-border p-6">
            <p className="mono-label text-muted-foreground">Why the myth is wrong</p>
            <p className="mt-3 text-sm text-muted-foreground">
              China sits in the northern hemisphere, same as Europe and North America. An antipode
              flips your hemisphere too — so Europe lands near New Zealand's ocean, and the US lands
              in the Indian Ocean.
            </p>
          </div>
        </aside>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <p className="mx-auto max-w-6xl font-mono text-xs text-muted-foreground">
          Earth radius 6 371 km · core ≈ 5 400 °C · antipode = (−lat, lng ± 180°)
        </p>
      </footer>
    </main>
  );
}
