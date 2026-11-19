import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import seedJson from "@/data/catalog.json";
import type { Category, Offer, Platform, PricePoint, Product } from "@/lib/types";

export type CatalogSnapshot = {
  products: Product[];
  source: "supabase" | "seed";
  warning?: string;
};

type OverrideFile = {
  updatedAt: string;
  offers: Record<
    string,
    {
      priceCents: number;
      inStock: boolean;
      lastCheckedAt: string;
      history: PricePoint[];
    }
  >;
};

type OfferRow = {
  id: string;
  product_slug: string;
  retailer: string;
  program: Offer["program"];
  price_cents: number;
  seed_price_cents: number;
  currency: "USD";
  url: string;
  in_stock: boolean;
  external_sku: string;
  last_checked_at: string;
};

type ProductRow = {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  platforms: Platform[];
  bias: Product["bias"];
  quality: number;
  summary: string;
  specs: Product["specs"];
  sample_note: string;
  offers: OfferRow[] | null;
};

type HistoryRow = {
  offer_id: string;
  price_cents: number;
  recorded_at: string;
};

const RUNTIME_DIR = path.join(process.cwd(), "data", "runtime");
const OVERRIDE_PATH = path.join(RUNTIME_DIR, "offers.json");
const CLICK_PATH = path.join(RUNTIME_DIR, "clicks.jsonl");

export function seedProducts(): Product[] {
  return seedJson as Product[];
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getCatalog(): Promise<CatalogSnapshot> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return readCatalog();
}

export async function readCatalog(): Promise<CatalogSnapshot> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const products = await readSupabaseCatalog(supabase);
      if (products.length > 0) {
        return { products, source: "supabase" };
      }
      return {
        products: applyOverrides(seedProducts(), readOverrides()),
        source: "seed",
        warning: "Supabase is configured but the products table is empty. Showing the local seed.",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Supabase error";
      return {
        products: applyOverrides(seedProducts(), readOverrides()),
        source: "seed",
        warning: `Supabase read failed (${message}). Showing the local seed.`,
      };
    }
  }
  return { products: applyOverrides(seedProducts(), readOverrides()), source: "seed" };
}

export function findProduct(snapshot: CatalogSnapshot, slug: string): Product | undefined {
  return snapshot.products.find((product) => product.slug === slug);
}

export function findOffer(snapshot: CatalogSnapshot, offerId: string): { product: Product; offer: Offer } | undefined {
  for (const product of snapshot.products) {
    const offer = product.offers.find((item) => item.id === offerId);
    if (offer) return { product, offer };
  }
  return undefined;
}

export async function logClick(event: {
  offerId: string;
  referrer: string | null;
  userAgent: string | null;
  destinationUrl: string;
  clickedAt: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("click_events").insert({
      offer_id: event.offerId,
      clicked_at: event.clickedAt,
      referrer: event.referrer,
      user_agent: event.userAgent,
      destination_url: event.destinationUrl,
    });
    if (error) throw new Error(error.message);
    return;
  }
  mkdirSync(RUNTIME_DIR, { recursive: true });
  appendFileSync(CLICK_PATH, `${JSON.stringify(event)}\n`);
}

export async function persistQuotes(
  snapshot: CatalogSnapshot,
  quotes: { offerId: string; priceCents: number; inStock: boolean }[],
  recordedAt: string,
): Promise<"supabase" | "file"> {
  if (quotes.length === 0) return snapshot.source === "supabase" ? "supabase" : "file";
  if (snapshot.source === "supabase") {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Supabase client disappeared during price refresh.");
    await persistSupabaseQuotes(supabase, snapshot, quotes, recordedAt);
    return "supabase";
  }
  persistFileQuotes(snapshot, quotes, recordedAt);
  return "file";
}

async function readSupabaseCatalog(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*, offers(*)");
  if (error) throw new Error(error.message);
  const { data: history, error: historyError } = await supabase
    .from("price_history")
    .select("offer_id, price_cents, recorded_at")
    .order("recorded_at", { ascending: true });
  if (historyError) throw new Error(historyError.message);

  const historyByOffer = new Map<string, PricePoint[]>();
  for (const row of (history ?? []) as HistoryRow[]) {
    const points = historyByOffer.get(row.offer_id) ?? [];
    points.push({ priceCents: row.price_cents, recordedAt: row.recorded_at });
    historyByOffer.set(row.offer_id, points);
  }

  return ((data ?? []) as ProductRow[]).map((row) => ({
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    platforms: row.platforms,
    bias: row.bias,
    quality: row.quality,
    summary: row.summary,
    specs: row.specs ?? [],
    sampleNote: row.sample_note,
    offers: (row.offers ?? []).map((offer) => ({
      id: offer.id,
      productSlug: offer.product_slug,
      retailer: offer.retailer,
      program: offer.program,
      priceCents: offer.price_cents,
      seedPriceCents: offer.seed_price_cents,
      currency: "USD" as const,
      url: offer.url,
      inStock: offer.in_stock,
      externalSku: offer.external_sku,
      lastCheckedAt: offer.last_checked_at,
      history: historyByOffer.get(offer.id) ?? [
        { priceCents: offer.price_cents, recordedAt: offer.last_checked_at },
      ],
    })),
  }));
}

async function persistSupabaseQuotes(
  supabase: SupabaseClient,
  snapshot: CatalogSnapshot,
  quotes: { offerId: string; priceCents: number; inStock: boolean }[],
  recordedAt: string,
): Promise<void> {
  for (const quote of quotes) {
    const known = findOffer(snapshot, quote.offerId);
    if (!known) continue;
    const { error } = await supabase
      .from("offers")
      .update({
        price_cents: quote.priceCents,
        in_stock: quote.inStock,
        last_checked_at: recordedAt,
      })
      .eq("id", quote.offerId);
    if (error) throw new Error(error.message);
    const { error: historyError } = await supabase.from("price_history").insert({
      offer_id: quote.offerId,
      price_cents: quote.priceCents,
      recorded_at: recordedAt,
    });
    if (historyError) throw new Error(historyError.message);
  }
}

function persistFileQuotes(
  snapshot: CatalogSnapshot,
  quotes: { offerId: string; priceCents: number; inStock: boolean }[],
  recordedAt: string,
): void {
  const current = readOverrides() ?? { updatedAt: recordedAt, offers: {} };
  for (const quote of quotes) {
    const known = findOffer(snapshot, quote.offerId);
    if (!known) continue;
    const prior = current.offers[quote.offerId]?.history ?? known.offer.history;
    const history = [...prior, { priceCents: quote.priceCents, recordedAt }].slice(-30);
    current.offers[quote.offerId] = {
      priceCents: quote.priceCents,
      inStock: quote.inStock,
      lastCheckedAt: recordedAt,
      history,
    };
  }
  current.updatedAt = recordedAt;
  mkdirSync(RUNTIME_DIR, { recursive: true });
  writeFileSync(OVERRIDE_PATH, `${JSON.stringify(current, null, 2)}\n`);
}

function readOverrides(): OverrideFile | null {
  try {
    const raw = readFileSync(OVERRIDE_PATH, "utf8");
    return JSON.parse(raw) as OverrideFile;
  } catch {
    return null;
  }
}

function applyOverrides(products: Product[], overrides: OverrideFile | null): Product[] {
  if (!overrides) return products;
  return products.map((product) => ({
    ...product,
    offers: product.offers.map((offer) => {
      const next = overrides.offers[offer.id];
      if (!next) return offer;
      return {
        ...offer,
        priceCents: next.priceCents,
        inStock: next.inStock,
        lastCheckedAt: next.lastCheckedAt,
        history: next.history,
      };
    }),
  }));
}
