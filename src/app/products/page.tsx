import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { formatUsd } from "@/lib/money";
import { categoryLabel, lowestInStockOffer } from "@/lib/recommend";
import { CATEGORIES, type Category, type Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Sample gear catalog",
  description:
    "Sample consoles, screens, headsets, and accessories for a GTA 6 setup. Prices are seeded examples, not live quotes.",
};

export default async function ProductsPage() {
  const snapshot = await getCatalog();
  const grouped = CATEGORIES.map((category) => ({
    category,
    products: snapshot.products.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);

  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Catalog</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">Sample gear</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {snapshot.products.length} products. Every price is a sample. Open a product to compare
        retailer offers.
        {snapshot.source === "seed" ? " This page is reading the local seed." : " This page is reading Supabase."}
      </p>
      {snapshot.warning ? (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {snapshot.warning}
        </p>
      ) : null}
      <div className="mt-10 space-y-10">
        {grouped.map((group) => (
          <section key={group.category}>
            <h2 className="font-display text-3xl">{categoryLabel(group.category)}</h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {group.products.map((product) => (
                <ProductRow key={product.slug} product={product} category={group.category} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product, category }: { product: Product; category: Category }) {
  const offer = lowestInStockOffer(product);
  return (
    <li>
      <Link href={`/products/${product.slug}`} className="flex flex-wrap items-baseline justify-between gap-3 py-4 hover:text-primary">
        <span>
          <span className="block font-medium text-foreground">{product.name}</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {product.brand} · {categoryLabel(category)} · {product.bias}
          </span>
        </span>
        <span className="font-mono text-sm">{offer ? `from ${formatUsd(offer.priceCents)}` : "No in-stock offer"}</span>
      </Link>
    </li>
  );
}
