import "server-only";
import type { Offer } from "@/lib/types";

export type PriceQuote = {
  offerId: string;
  priceCents: number;
  inStock: boolean;
};

export type ProviderBatch = {
  provider: string;
  quotes: PriceQuote[];
  skipped: { offerId: string; reason: string }[];
};

export type PriceProvider = {
  id: string;
  fetchPrices: (offers: Offer[], now: Date) => Promise<ProviderBatch>;
};

export type ProviderEnv = {
  /** mock | amazon | bestbuy | auto. Default auto, which uses mock unless a live adapter is configured. */
  mode: string;
  amazonConfigured: boolean;
  bestBuyConfigured: boolean;
};

/**
 * Daily wobble of -4% to +4% around the seeded sample price.
 * Keyed by offer id and UTC day so a rerun the same day is stable.
 */
export function mockPriceCents(seedPriceCents: number, offerId: string, day: string): number {
  let hash = 2166136261;
  const input = `${offerId}:${day}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const bucket = (hash >>> 0) % 9;
  const delta = (bucket - 4) / 100;
  return Math.max(1, Math.round(seedPriceCents * (1 + delta)));
}

export const mockProvider: PriceProvider = {
  id: "mock",
  async fetchPrices(offers, now) {
    const day = now.toISOString().slice(0, 10);
    return {
      provider: "mock",
      quotes: offers.map((offer) => ({
        offerId: offer.id,
        priceCents: mockPriceCents(offer.seedPriceCents, offer.id, day),
        inStock: offer.inStock,
      })),
      skipped: [],
    };
  },
};

/**
 * Amazon Product Advertising API adapter.
 * This MVP does not sign or send PA-API requests. When credentials are present
 * the adapter refuses to invent a price and reports each offer as skipped.
 * A real implementation would POST to GetItems on AMAZON_PAAPI_HOST.
 */
export const amazonPaapiProvider: PriceProvider = {
  id: "amazon-paapi",
  async fetchPrices(offers) {
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY?.trim();
    const secret = process.env.AMAZON_PAAPI_SECRET_KEY?.trim();
    const partner = process.env.AMAZON_PAAPI_PARTNER_TAG?.trim();
    if (!accessKey || !secret || !partner) {
      return {
        provider: "amazon-paapi",
        quotes: [],
        skipped: offers.map((offer) => ({
          offerId: offer.id,
          reason: "Amazon PA-API credentials are not set (AMAZON_PAAPI_ACCESS_KEY, AMAZON_PAAPI_SECRET_KEY, AMAZON_PAAPI_PARTNER_TAG).",
        })),
      };
    }
    return {
      provider: "amazon-paapi",
      quotes: [],
      skipped: offers.map((offer) => ({
        offerId: offer.id,
        reason:
          "Amazon PA-API adapter is a stub. It does not call Amazon and will not invent a live price. Use PRICE_PROVIDER=mock until signing is implemented.",
      })),
    };
  },
};

/**
 * Best Buy Products API adapter.
 * Stub only. A real call would GET
 * https://api.bestbuy.com/v1/products(sku={externalSku}).json?apiKey=BESTBUY_API_KEY
 */
export const bestBuyProvider: PriceProvider = {
  id: "bestbuy",
  async fetchPrices(offers) {
    const apiKey = process.env.BESTBUY_API_KEY?.trim();
    if (!apiKey) {
      return {
        provider: "bestbuy",
        quotes: [],
        skipped: offers.map((offer) => ({
          offerId: offer.id,
          reason: "BESTBUY_API_KEY is not set.",
        })),
      };
    }
    return {
      provider: "bestbuy",
      quotes: [],
      skipped: offers.map((offer) => ({
        offerId: offer.id,
        reason:
          "Best Buy adapter is a stub. It does not call the Products API and will not invent a live price. Use PRICE_PROVIDER=mock until the request is implemented.",
      })),
    };
  },
};

export function providerForOffer(offer: Offer, env: ProviderEnv): PriceProvider {
  const mode = env.mode || "auto";
  if (mode === "mock") return mockProvider;
  if (mode === "amazon") {
    return offer.program === "amazon" ? amazonPaapiProvider : mockProvider;
  }
  if (mode === "bestbuy") {
    return offer.program === "bestbuy" ? bestBuyProvider : mockProvider;
  }
  if (offer.program === "amazon" && env.amazonConfigured) return amazonPaapiProvider;
  if (offer.program === "bestbuy" && env.bestBuyConfigured) return bestBuyProvider;
  return mockProvider;
}

export function providerEnvFromProcess(): ProviderEnv {
  const amazonConfigured = Boolean(
    process.env.AMAZON_PAAPI_ACCESS_KEY?.trim() &&
      process.env.AMAZON_PAAPI_SECRET_KEY?.trim() &&
      process.env.AMAZON_PAAPI_PARTNER_TAG?.trim(),
  );
  return {
    mode: process.env.PRICE_PROVIDER?.trim() || "auto",
    amazonConfigured,
    bestBuyConfigured: Boolean(process.env.BESTBUY_API_KEY?.trim()),
  };
}

/** Oldest stale offers first, capped so one run cannot walk the whole network. */
export function selectStaleOffers(
  offers: Offer[],
  nowMs: number,
  staleHours: number,
  batchSize: number,
): Offer[] {
  const cutoff = nowMs - staleHours * 60 * 60 * 1000;
  return offers
    .filter((offer) => {
      const checked = Date.parse(offer.lastCheckedAt);
      return Number.isFinite(checked) && checked <= cutoff;
    })
    .sort(
      (a, b) =>
        Date.parse(a.lastCheckedAt) - Date.parse(b.lastCheckedAt) || a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(0, batchSize));
}
