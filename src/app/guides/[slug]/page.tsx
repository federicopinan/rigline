import { cacheLife } from "next/cache";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuideBody } from "@/components/guide-body";
import { JsonLd } from "@/components/json-ld";
import { getCatalog, seedProducts } from "@/lib/catalog";
import { getGuide, readGuides } from "@/lib/guides";
import { formatUsd } from "@/lib/money";
import { lowestInStockOffer } from "@/lib/recommend";
import { siteUrl } from "@/lib/site";
import { SAMPLE_PRICE_NOTE } from "@/lib/types";

export function generateStaticParams() {
  return readGuides().map((guide) => ({ slug: guide.slug }));
}

type GuideParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: GuideParams): Promise<Metadata> {
  "use cache";
  cacheLife("days");
  const { slug } = await props.params;
  const guide = readGuides().find((item) => item.slug === slug);
  if (!guide) return { title: "Guide" };
  return {
    title: guide.title,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
    },
  };
}

export default function GuidePage(props: GuideParams) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading the guide…</p>}>
      <GuideArticle params={props.params} />
    </Suspense>
  );
}

async function GuideArticle({ params }: { params: GuideParams["params"] }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();
  const snapshot = await getCatalog();
  const mentioned = guide.products.flatMap((productSlug) => {
    const product = snapshot.products.find((item) => item.slug === productSlug) ?? seedProducts().find((item) => item.slug === productSlug);
    return product ? [product] : [];
  });
  const base = siteUrl();

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.published,
    author: { "@type": "Organization", name: "Rigline" },
    mainEntityOfPage: `${base}/guides/${guide.slug}`,
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faqItem) => ({
      "@type": "Question",
      name: faqItem.q,
      acceptedAnswer: { "@type": "Answer", text: faqItem.a },
    })),
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: guide.title,
    itemListElement: mentioned.map((product, index) => {
      const offer = lowestInStockOffer(product);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `${base}/products/${product.slug}`,
        name: product.name,
        description: `${product.summary} ${SAMPLE_PRICE_NOTE}${offer ? ` Sample low price ${formatUsd(offer.priceCents)}.` : ""}`,
      };
    }),
  };

  return (
    <article>
      <JsonLd data={article} />
      {guide.faqs.length > 0 ? <JsonLd data={faq} /> : null}
      {mentioned.length > 0 ? <JsonLd data={itemList} /> : null}
      <p className="text-xs tracking-[0.18em] text-primary uppercase">{guide.published}</p>
      <h1 className="font-display mt-2 max-w-3xl text-4xl text-foreground sm:text-5xl">{guide.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{guide.description}</p>
      <GuideBody markdown={guide.body} />
      {guide.faqs.length > 0 ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-3xl">Questions</h2>
          <dl className="mt-4 space-y-4">
            {guide.faqs.map((faqItem) => (
              <div key={faqItem.q} className="rounded-xl border border-border px-4 py-3">
                <dt className="font-medium">{faqItem.q}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{faqItem.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      <p className="mt-10 text-sm">
        <Link href="/build" className="text-primary underline-offset-4 hover:underline">
          Open the builder
        </Link>
      </p>
    </article>
  );
}
