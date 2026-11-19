import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { OfferTable } from "@/components/offer-table";
import { Sparkline } from "@/components/sparkline";
import { Badge } from "@/components/ui/badge";
import { findProduct, getCatalog, seedProducts } from "@/lib/catalog";
import { platformLabel } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { lowestInStockOffer, sortedOffers } from "@/lib/recommend";
import { siteUrl } from "@/lib/site";
import { SAMPLE_PRICE_NOTE, type Product } from "@/lib/types";

export function generateStaticParams() {
  return seedProducts().map((product) => ({ slug: product.slug }));
}

type ProductParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: ProductParams): Promise<Metadata> {
  "use cache";
  cacheLife("hours");
  const { slug } = await props.params;
  const product = seedProducts().find((item) => item.slug === slug);
  if (!product) return { title: "Product" };
  const offer = lowestInStockOffer(product);
  const description = `${product.summary} ${SAMPLE_PRICE_NOTE}${offer ? ` Lowest sample offer ${formatUsd(offer.priceCents)}.` : ""}`;
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
    },
  };
}

export default function ProductPage(props: ProductParams) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading the sample offers…</p>}>
      <ProductBody params={props.params} />
    </Suspense>
  );
}

async function ProductBody({ params }: { params: ProductParams["params"] }) {
  const { slug } = await params;
  const snapshot = await getCatalog();
  const product = findProduct(snapshot, slug);
  if (!product) notFound();
  const offers = sortedOffers(product);
  const lowest = lowestInStockOffer(product);
  const base = siteUrl();

  return (
    <article>
      <JsonLd data={productJsonLd(product, base)} />
      <p className="text-xs tracking-[0.18em] text-primary uppercase">{product.category}</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">{product.name}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">{product.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{product.brand}</Badge>
        <Badge variant="outline">{product.bias}</Badge>
        {product.platforms.map((platform) => (
          <Badge key={platform} variant="outline">
            {platformLabel(platform)}
          </Badge>
        ))}
      </div>
      {snapshot.warning ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {snapshot.warning}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Lowest in-stock sample price</p>
          <p className="font-display text-4xl">{lowest ? formatUsd(lowest.priceCents) : "Unavailable"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{product.sampleNote}</p>
        </div>
        {lowest ? (
          <div>
            <Sparkline points={lowest.history} />
            <p className="mt-1 text-xs text-muted-foreground">Sample history, not a live feed.</p>
          </div>
        ) : null}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Offers</h2>
        <div className="mt-4">
          <OfferTable offers={offers} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Specs in this catalog</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {product.specs.map((spec) => (
            <div key={spec.label} className="rounded-xl border border-border px-4 py-3">
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">{spec.label}</dt>
              <dd className="mt-1 text-sm">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 text-sm">
        <Link href="/build" className="text-primary underline-offset-4 hover:underline">
          Use this in a budget build
        </Link>
      </p>
    </article>
  );
}

function productJsonLd(product: Product, base: string): Record<string, unknown> {
  const prices = product.offers.map((offer) => offer.priceCents);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: `${product.summary} ${SAMPLE_PRICE_NOTE}`,
    brand: { "@type": "Brand", name: product.brand },
    url: `${base}/products/${product.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (low / 100).toFixed(2),
      highPrice: (high / 100).toFixed(2),
      offerCount: product.offers.length,
      availability: product.offers.some((offer) => offer.inStock)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}
