import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { SetupForm } from "@/components/setup-form";
import { Badge } from "@/components/ui/badge";
import { getGuides } from "@/lib/guides";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import type { BuildRequest } from "@/lib/types";

const DEFAULT_REQUEST: BuildRequest = {
  budgetCents: 120000,
  platform: "ps5",
  preference: "cinematic",
  owned: [],
  extras: [],
};

const PRESETS = [
  {
    href: "/build?budget=600&platform=xbox&play=competitive&currency=USD",
    label: "Under $600",
    detail: "Xbox Series S first. A small screen if anything fits.",
  },
  {
    href: "/build?budget=1000&platform=ps5&play=balanced&currency=USD",
    label: "$1,000",
    detail: "A PS5 and the best screen the leftover money can hold.",
  },
  {
    href: "/build?budget=1800&platform=ps5&play=cinematic&currency=USD",
    label: "$1,800",
    detail: "Disc PS5, a 55-inch class TV, headset, and storage.",
  },
  {
    href: "/build?budget=2500&platform=ps5&play=cinematic&currency=USD",
    label: "$2,500",
    detail: "The sample catalog's OLED budget.",
  },
];

export default async function HomePage() {
  const guides = await getGuides();
  const base = siteUrl();

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          url: base,
        }}
      />

      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <Badge variant="secondary">PS5 and Xbox Series at launch</Badge>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] text-foreground sm:text-6xl">
            Build the setup GTA 6 actually runs on.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Name a budget. Rigline splits it across a console, a screen, a headset, and the extras
            that still fit, then tells you why each piece won. PC comes later. A graphics card is
            not a launch plan.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {PRESETS.map((preset) => (
              <Link
                key={preset.href}
                href={preset.href}
                className="rounded-xl border border-border bg-card/70 px-4 py-3 hover:border-primary"
              >
                <dt className="font-display text-xl text-foreground">{preset.label}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{preset.detail}</dd>
              </Link>
            ))}
          </dl>
        </div>
        <SetupForm request={DEFAULT_REQUEST} />
      </section>

      <section className="mt-16 grid gap-8 border-t border-border pt-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="font-display text-3xl text-foreground">How the money is split</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            No model writes the list. The same budget always returns the same products. The result
            page shows the ceiling, the runner-up, and the score.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2">
          <li className="rounded-xl border border-border p-4">
            <p className="text-xs tracking-[0.16em] text-primary uppercase">01</p>
            <h3 className="mt-2 font-medium">Pick the tier</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Under $600, $600–$1,000, $1,000–$1,800, or $1,800 and up. Entry caps the console near
              $460 so a disc box cannot eat the whole budget.
            </p>
          </li>
          <li className="rounded-xl border border-border p-4">
            <p className="text-xs tracking-[0.16em] text-primary uppercase">02</p>
            <h3 className="mt-2 font-medium">Buy the console first</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              PS5 or Xbox Series only. If you already own one, that slot is skipped. PC later skips
              it on purpose.
            </p>
          </li>
          <li className="rounded-xl border border-border p-4">
            <p className="text-xs tracking-[0.16em] text-primary uppercase">03</p>
            <h3 className="mt-2 font-medium">Weight what is left</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cinematic builds give the screen about 58% of the remainder. Competitive builds keep
              more for the headset and controller. Chair and desk stay out until you ask.
            </p>
          </li>
          <li className="rounded-xl border border-border p-4">
            <p className="text-xs tracking-[0.16em] text-primary uppercase">04</p>
            <h3 className="mt-2 font-medium">Score inside the slot</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Quality, a preference bonus, and a penalty for blowing the allocation. The cheapest
              in-stock sample offer wins the tie. Nothing is allowed to go over the budget.
            </p>
          </li>
        </ol>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-foreground">Guides</h2>
          <Link href="/guides" className="text-sm text-primary underline-offset-4 hover:underline">
            All guides
          </Link>
        </div>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guides/${guide.slug}`}
                className="block h-full rounded-xl border border-border bg-card/60 p-5 hover:border-primary"
              >
                <p className="text-xs text-muted-foreground">{guide.published}</p>
                <h3 className="font-display mt-2 text-2xl leading-tight text-foreground">{guide.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
