import { revalidateTag } from "next/cache";
import { readCatalog, persistQuotes } from "@/lib/catalog";
import {
  providerEnvFromProcess,
  providerForOffer,
  selectStaleOffers,
  type PriceProvider,
  type PriceQuote,
} from "@/lib/pricing/providers";

export type RefreshReport = {
  source: "supabase" | "seed";
  considered: number;
  refreshed: number;
  staleHours: number;
  batchSize: number;
  providers: string[];
  skipped: { offerId: string; reason: string }[];
  persisted: "supabase" | "file" | "none";
  warning?: string;
};

export async function refreshStaleOffers(now = new Date()): Promise<RefreshReport> {
  const snapshot = await readCatalog();
  const staleHours = numberEnv("PRICE_STALE_HOURS", 12);
  const batchSize = numberEnv("PRICE_BATCH_SIZE", 100);
  const offers = snapshot.products.flatMap((product) => product.offers);
  const stale = selectStaleOffers(offers, now.getTime(), staleHours, batchSize);
  const env = providerEnvFromProcess();

  const groups = new Map<string, { provider: PriceProvider; offers: typeof stale }>();
  for (const offer of stale) {
    const provider = providerForOffer(offer, env);
    const group = groups.get(provider.id) ?? { provider, offers: [] };
    group.offers.push(offer);
    groups.set(provider.id, group);
  }

  const quotes: PriceQuote[] = [];
  const skipped: { offerId: string; reason: string }[] = [];
  for (const group of groups.values()) {
    const batch = await group.provider.fetchPrices(group.offers, now);
    quotes.push(...batch.quotes);
    skipped.push(...batch.skipped);
  }

  let persisted: RefreshReport["persisted"] = "none";
  if (quotes.length > 0) {
    persisted = await persistQuotes(snapshot, quotes, now.toISOString());
    revalidateTag("catalog", { expire: 0 });
  }

  return {
    source: snapshot.source,
    considered: offers.length,
    refreshed: quotes.length,
    staleHours,
    batchSize,
    providers: [...groups.keys()],
    skipped,
    persisted,
    warning: snapshot.warning,
  };
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return value;
}
