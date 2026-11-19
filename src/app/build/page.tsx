import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CopyLink } from "@/components/copy-link";
import { SetupForm } from "@/components/setup-form";
import { SpendBar } from "@/components/spend-bar";
import { Badge } from "@/components/ui/badge";
import { getCatalog } from "@/lib/catalog";
import { retailerLabel } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { parseBuildQuery, toSearchParams, type SearchParams } from "@/lib/query";
import { categoryLabel, recommend } from "@/lib/recommend";
import type { BuildRequest } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your setup",
  description: "A budget split for a GTA 6 setup, with the reason each product was picked.",
  robots: { index: false, follow: true },
};

const EMPTY_REQUEST: BuildRequest = {
  budgetCents: 120000,
  platform: "ps5",
  preference: "cinematic",
  owned: [],
  extras: [],
};

export default function BuildPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.18em] text-primary uppercase">Builder</p>
      <h1 className="font-display mt-2 text-4xl text-foreground sm:text-5xl">Your GTA 6 setup</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Change the form and the URL updates. That URL is the share link.
      </p>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">Reading the budget…</p>}>
        <BuildResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BuildResults({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const parsed = parseBuildQuery(params);
  const formRequest = parsed.status === "ok" ? parsed.request : EMPTY_REQUEST;

  return (
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <SetupForm request={formRequest} />
      <div>
        {parsed.status === "empty" ? (
          <EmptyState />
        ) : parsed.status === "error" ? (
          <p role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
            {parsed.message}
          </p>
        ) : (
          <Result request={parsed.request} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-8">
      <h2 className="font-display text-2xl">Add a budget to see a setup.</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Try a{" "}
        <Link
          href="/build?budget=1000&platform=ps5&play=balanced&currency=USD"
          className="text-primary underline-offset-4 hover:underline"
        >
          $1,000 PS5 build
        </Link>{" "}
        or a{" "}
        <Link
          href="/build?budget=600&platform=xbox&play=competitive&currency=USD"
          className="text-primary underline-offset-4 hover:underline"
        >
          $600 Xbox build
        </Link>
        .
      </p>
    </div>
  );
}

async function Result({ request }: { request: BuildRequest }) {
  const snapshot = await getCatalog();
  const result = recommend(request, snapshot.products);
  const sharePath = `/build?${toSearchParams(request)}`;

  return (
    <div className="space-y-6">
      {snapshot.warning ? (
        <p role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          {snapshot.warning}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{result.tier.label}</Badge>
        <Badge variant="outline">{snapshot.source === "supabase" ? "Supabase catalog" : "Local seed catalog"}</Badge>
      </div>
      <div>
        <h2 className="font-display text-3xl text-foreground">
          {formatUsd(result.spentCents)} of {formatUsd(request.budgetCents)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{formatUsd(result.leftoverCents)} left unspent.</p>
      </div>
      <SpendBar
        budgetCents={request.budgetCents}
        leftoverCents={result.leftoverCents}
        slices={result.picks.map((pick) => ({ category: pick.category, cents: pick.offer.priceCents }))}
      />
      <ul className="space-y-3">
        {result.notes.map((note) => (
          <li key={note} className="text-sm leading-6 text-muted-foreground">
            {note}
          </li>
        ))}
      </ul>

      {result.picks.length === 0 ? (
        <p className="rounded-xl border border-border px-4 py-3 text-sm">
          Nothing in the sample catalog fits this budget. The gaps below say what blocked each slot.
        </p>
      ) : (
        <ol className="space-y-4">
          {result.picks.map((pick) => (
            <li key={pick.category} className="rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs tracking-[0.16em] text-primary uppercase">
                  {categoryLabel(pick.category)}
                </p>
                <p className="font-mono text-lg">{formatUsd(pick.offer.priceCents)}</p>
              </div>
              <h3 className="font-display mt-1 text-2xl">
                <Link href={`/products/${pick.product.slug}`} className="hover:text-primary">
                  {pick.product.name}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{pick.product.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-foreground/90">
                {pick.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                <a
                  href={`/go/${pick.offer.id}`}
                  rel="sponsored nofollow noopener"
                  target="_blank"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Lowest sample offer at {retailerLabel(pick.offer.retailer)}
                </a>
              </p>
            </li>
          ))}
        </ol>
      )}

      {result.gaps.length > 0 ? (
        <section>
          <h3 className="font-display text-2xl">Left out</h3>
          <ul className="mt-3 space-y-3">
            {result.gaps.map((gap) => (
              <li key={gap.category} className="rounded-xl border border-dashed border-border px-4 py-3">
                <p className="text-sm font-medium">{categoryLabel(gap.category)}</p>
                {gap.reasons.map((reason) => (
                  <p key={reason} className="mt-1 text-sm leading-6 text-muted-foreground">
                    {reason}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="rounded-xl border border-border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">How this split was calculated</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {result.explanation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <CopyLink path={sharePath} />
        <p className="text-xs break-all text-muted-foreground">{sharePath}</p>
      </div>
    </div>
  );
}
