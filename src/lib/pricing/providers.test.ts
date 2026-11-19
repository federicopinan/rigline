import { describe, expect, it } from "vitest";
import { amazonPaapiProvider, bestBuyProvider, mockPriceCents, mockProvider, providerForOffer, selectStaleOffers } from "@/lib/pricing/providers";
import type { Offer } from "@/lib/types";

function offer(id: string, checked: string, program: Offer["program"] = "amazon"): Offer {
  return {
    id,
    productSlug: "sample",
    retailer: program === "bestbuy" ? "bestbuy" : "amazon",
    program,
    priceCents: 10000,
    seedPriceCents: 10000,
    currency: "USD",
    url: "https://example.com/item",
    inStock: true,
    externalSku: `sample-${id}`,
    lastCheckedAt: checked,
    history: [],
  };
}

describe("mock prices", () => {
  it("stays within 4 percent of the seed and is stable for a day", () => {
    const first = mockPriceCents(44900, "sony-ps5-slim-digital-amazon", "2026-11-19");
    const second = mockPriceCents(44900, "sony-ps5-slim-digital-amazon", "2026-11-19");
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(Math.round(44900 * 0.96));
    expect(first).toBeLessThanOrEqual(Math.round(44900 * 1.04));
  });

  it("returns a quote for every offer", async () => {
    const batch = await mockProvider.fetchPrices(
      [offer("a", "2026-11-01T00:00:00.000Z")],
      new Date("2026-11-19T12:00:00.000Z"),
    );
    expect(batch.quotes).toHaveLength(1);
    expect(batch.skipped).toHaveLength(0);
  });
});

describe("selectStaleOffers", () => {
  const now = Date.parse("2026-11-19T12:00:00.000Z");

  it("skips fresh offers and caps the batch", () => {
    const stale = offer("stale", "2026-11-18T00:00:00.000Z");
    const older = offer("older", "2026-11-01T00:00:00.000Z");
    const fresh = offer("fresh", "2026-11-19T10:00:00.000Z");
    const selected = selectStaleOffers([fresh, stale, older], now, 12, 1);
    expect(selected.map((item) => item.id)).toEqual(["older"]);
  });
});

describe("provider selection", () => {
  it("uses the mock provider unless a live adapter is configured", () => {
    const amazon = offer("a", "2026-11-01T00:00:00.000Z", "amazon");
    expect(providerForOffer(amazon, { mode: "auto", amazonConfigured: false, bestBuyConfigured: false }).id).toBe(
      "mock",
    );
    expect(providerForOffer(amazon, { mode: "auto", amazonConfigured: true, bestBuyConfigured: false }).id).toBe(
      "amazon-paapi",
    );
    expect(providerForOffer(amazon, { mode: "mock", amazonConfigured: true, bestBuyConfigured: true }).id).toBe(
      "mock",
    );
  });

  it("does not invent prices when the PA-API or Best Buy stubs are selected", async () => {
    const amazon = await amazonPaapiProvider.fetchPrices(
      [offer("a", "2026-11-01T00:00:00.000Z")],
      new Date("2026-11-19T12:00:00.000Z"),
    );
    expect(amazon.quotes).toHaveLength(0);
    expect(amazon.skipped[0]?.reason).toMatch(/not set|stub/i);

    const previous = process.env.BESTBUY_API_KEY;
    process.env.BESTBUY_API_KEY = "test-key";
    const bestBuy = await bestBuyProvider.fetchPrices(
      [offer("b", "2026-11-01T00:00:00.000Z", "bestbuy")],
      new Date("2026-11-19T12:00:00.000Z"),
    );
    process.env.BESTBUY_API_KEY = previous;
    expect(bestBuy.quotes).toHaveLength(0);
    expect(bestBuy.skipped[0]?.reason).toMatch(/stub/i);
  });
});
