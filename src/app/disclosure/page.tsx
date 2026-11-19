import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description: "How Rigline uses affiliate links, and why the prices on this site are samples.",
};

export default function DisclosurePage() {
  return (
    <article className="max-w-3xl">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Disclosure</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">Affiliate disclosure</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-foreground/90">
        <p>
          Some outbound links on Rigline are affiliate links. If you buy through one, the retailer
          or its affiliate network may pay Rigline a commission. You do not pay extra because of
          that. Links that can earn a commission use <code>rel=&quot;sponsored nofollow&quot;</code>.
        </p>
        <p>
          The price next to a product is a <strong>sample catalog price</strong>. It was typed into
          the seed data for this demo. It is not a live Amazon, Best Buy, Walmart, or Target quote,
          and it will not match what you are charged today. The scheduled price job can nudge those
          samples with a mock provider. That wobble is still not a live price.
        </p>
        <p>
          Amazon Associates uses a <code>tag</code> parameter, added only when{" "}
          <code>AMAZON_ASSOCIATE_TAG</code> is set. Best Buy, Walmart, and Target links append an id
          or wrap a deep-link template from the matching environment variable. If the variable is
          empty, the redirect sends you to the plain merchant URL and still logs the click.
        </p>
        <p>
          Do not treat a Rigline recommendation as a review we ran in a lab. The score is a
          published formula over this catalog: quality, your play style, and whether the price fits
          the slot in your budget.
        </p>
        <p>
          <Link href="/build" className="text-primary underline-offset-4 hover:underline">
            Back to the builder
          </Link>
        </p>
      </div>
    </article>
  );
}
