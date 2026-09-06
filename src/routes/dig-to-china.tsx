import { createFileRoute, Link } from "@tanstack/react-router";
import AdSlot from "@/components/AdSlot";

const PAGE_URL = "https://earthdrillexplorer.com/dig-to-china";
const OG_IMAGE_URL = "https://earthdrillexplorer.com/og-earth-drill.jpg";

export const Route = createFileRoute("/dig-to-china")({
  head: () => ({
    meta: [
      { title: "Digging to China? Where You'd Actually Come Out" },
      {
        name: "description",
        content:
          "The 'dig to China' myth is wrong for almost everyone. Digging straight through Earth from the US lands in the Indian Ocean, from Europe in the South Pacific. See where you'd really surface.",
      },
      { property: "og:title", content: "Digging to China? Where You'd Actually Come Out" },
      {
        property: "og:description",
        content:
          "Click the map, drop the drill, and discover why almost nobody on Earth digs to China — and who actually does.",
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
        content: "Digging to China myth debunked — Antipodes Earth Drill",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
      {
        name: "twitter:image:alt",
        content: "Digging to China myth debunked — Antipodes Earth Drill",
      },
      { name: "robots", content: "index, follow" },
      {
        name: "keywords",
        content:
          "dig to china, can you dig to china, what is opposite of USA, antipode of United States, dig hole through earth, where do you come out",
      },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Digging to China? Where You'd Actually Come Out",
          description:
            "Why the 'dig to China' myth is geographically wrong for almost everyone, where you would really surface, and who actually can dig to China.",
          image: OG_IMAGE_URL,
          url: PAGE_URL,
          mainEntityOfPage: PAGE_URL,
          author: { "@type": "Organization", name: "Antipodes Earth Drill" },
          publisher: {
            "@type": "Organization",
            name: "Antipodes Earth Drill",
            logo: {
              "@type": "ImageObject",
              url: OG_IMAGE_URL,
            },
          },
        }),
      },
    ],
  }),
  component: DigToChina,
});

const ORIGINS = [
  {
    place: "New York, USA",
    real: "South Indian Ocean",
    detail: "~1,500 km south of Western Australia. Open water, not Asia.",
  },
  {
    place: "London, UK",
    real: "South Pacific Ocean",
    detail: "~2,000 km east of New Zealand. About as far from China as possible.",
  },
  {
    place: "Paris, France",
    real: "South Pacific Ocean",
    detail: "Near New Zealand's antipodal waters.",
  },
  { place: "Tokyo, Japan", real: "South Atlantic Ocean", detail: "Just off the coast of Uruguay." },
  {
    place: "Sydney, Australia",
    real: "North Atlantic Ocean",
    detail: "Halfway between Bermuda and the Azores.",
  },
  {
    place: "Moscow, Russia",
    real: "South Pacific Ocean",
    detail: "Empty ocean, thousands of km from land.",
  },
  {
    place: "Beijing, China",
    real: "South Atlantic Ocean",
    detail: "Even China doesn't dig to China — you'd surface near Argentina.",
  },
];

function DigToChina() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="absolute inset-0 topo opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-muted/50" />
        <div className="relative mx-auto max-w-4xl px-6 pb-12 pt-14 sm:pt-20">
          <p className="mono-label text-primary">The great geography myth</p>
          <h1 className="mt-3 text-4xl leading-[0.95] text-foreground sm:text-6xl">
            Digging to China?
            <span className="block text-primary">You'd hit ocean instead.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            Generations of kids were told that digging straight down leads to China. The geometry
            says otherwise — for almost everyone on Earth, the other side is open ocean.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/"
              search={{}}
              className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
            >
              ⛏ Try the drill yourself
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 pt-6">
        <AdSlot slot="" label="Advertisement" minHeight={90} />
      </div>

      {/* Why the myth is wrong */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <p className="mono-label text-primary">The geography</p>
        <h2 className="mt-3 text-3xl text-foreground">
          Why digging to China is impossible (for most of us)
        </h2>
        <div className="mt-5 space-y-4 text-base text-muted-foreground leading-relaxed">
          <p>
            To dig to another country, that country must be your{" "}
            <strong className="text-foreground">antipode</strong> — the point diametrically opposite
            you, found by negating your latitude and shifting your longitude by 180°. China sits
            between roughly 20°N and 50°N. The United States, Canada and all of Europe are also in
            the northern hemisphere — so flipping the latitude alone already rules China out for all
            of them.
          </p>
          <p>
            The continental United States is antipodal to the{" "}
            <strong className="text-foreground">Indian Ocean</strong>, south of the Kerguelen
            Islands. Europe and the UK are antipodal to the{" "}
            <strong className="text-foreground">South Pacific Ocean</strong>, near New Zealand.
            Neither hemisphere-mate comes anywhere close to East Asia.
          </p>
          <p>
            The deeper reason is that Earth's land is lopsided: the northern hemisphere holds most
            of the landmass, while the southern hemisphere is mostly water. Over{" "}
            <strong className="text-foreground">
              90% of all land on Earth is antipodal to open ocean
            </strong>{" "}
            — which is why the drill almost always ends in a splash.
          </p>
        </div>
      </section>

      {/* Origin table */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="mono-label text-primary">The evidence</p>
          <h2 className="mt-3 text-3xl text-foreground">Where famous cities actually surface</h2>
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Dig from
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    You emerge in
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider sm:table-cell">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {ORIGINS.map((row, i) => (
                  <tr key={row.place} className={i % 2 === 0 ? "bg-background" : "bg-card"}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.place}</td>
                    <td className="px-4 py-3 text-primary font-medium">{row.real}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Who CAN dig to China */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="mono-label text-primary">The twist</p>
          <h2 className="mt-3 text-3xl text-foreground">Who actually can dig to China?</h2>
          <div className="mt-5 space-y-4 text-base text-muted-foreground leading-relaxed">
            <p>
              The one region on Earth whose antipode really does land in China is{" "}
              <strong className="text-foreground">Argentina and central Chile</strong>. Buenos Aires
              drills through to the Shanghai area — the only major city-to-China pairing on the
              planet. If the idiom should belong to anyone, it's the Argentines.
            </p>
            <p>
              A few other rare land-to-land antipodes exist: Spain mirrors New Zealand, and Taiwan
              mirrors Paraguay. But for everyone else, the childhood promise of popping out in China
              ends several kilometres deep in the middle of an ocean.
            </p>
          </div>
          <div className="mt-8 rounded-xl border border-primary/40 bg-card p-6 shadow-sm">
            <p className="mono-label text-primary">Prove it yourself</p>
            <p className="mt-3 text-base text-muted-foreground">
              Click anywhere on the interactive map and watch the drill descend 12,742 km through
              the crust, mantle and 5,400 °C core to your exact antipodal point.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/"
                search={{}}
                className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-5 py-2 font-mono text-sm text-primary-foreground transition-all hover:opacity-90"
              >
                ⛏ Drop the drill
              </Link>
              <Link
                to="/game"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 font-mono text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                🎮 Play the guessing game
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
            Earth radius 6 371 km · core ≈ 5 400 °C · antipode = (−lat, lng ± 180°)
          </p>
          <div className="flex gap-4 font-mono text-xs">
            <Link
              to="/"
              search={{}}
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Earth Drill Map
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
