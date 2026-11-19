import type { Metadata } from "next";
import Link from "next/link";
import { getGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "GTA 6 buying guides",
  description: "Guides for a GTA 6 TV, a headset under $100, and a full setup under $1,000. Prices are samples.",
};

export default async function GuidesPage() {
  const guides = await getGuides();
  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Guides</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">Buying guides</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Written against the sample catalog, then linked back into the builder so the numbers can be
        rerun.
      </p>
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link href={`/guides/${guide.slug}`} className="block py-5 hover:text-primary">
              <span className="text-xs text-muted-foreground">{guide.published}</span>
              <span className="font-display mt-1 block text-3xl text-foreground">{guide.title}</span>
              <span className="mt-2 block max-w-2xl text-sm leading-6 text-muted-foreground">
                {guide.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
