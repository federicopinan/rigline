import { describe, expect, it } from "vitest";
import catalogJson from "@/data/catalog.json";
import { recommend } from "@/lib/recommend";
import type { BuildRequest, Category, Platform, Product } from "@/lib/types";

const catalog = catalogJson as Product[];

function request(overrides: Partial<BuildRequest> = {}): BuildRequest {
  return {
    budgetCents: 120000,
    platform: "ps5",
    preference: "balanced",
    owned: [],
    extras: [],
    ...overrides,
  };
}

function slugs(result: ReturnType<typeof recommend>): string[] {
  return result.picks.map((pick) => pick.product.slug);
}

describe("recommend", () => {
  it("is deterministic for the same catalog and request", () => {
    const input = request({ preference: "cinematic", budgetCents: 150000 });
    expect(slugs(recommend(input, catalog))).toEqual(slugs(recommend(input, catalog)));
  });

  it("never spends more than the budget", () => {
    const budgets = [100, 350, 550, 599, 600, 800, 1000, 1400, 1799, 1800, 2500, 4000];
    const platforms = ["ps5", "xbox", "pc-later"] as const;
    const preferences = ["competitive", "cinematic", "balanced"] as const;
    for (const dollars of budgets) {
      for (const platform of platforms) {
        for (const preference of preferences) {
          const result = recommend(request({ budgetCents: dollars * 100, platform, preference }), catalog);
          expect(result.spentCents).toBeLessThanOrEqual(dollars * 100);
          expect(result.leftoverCents).toBe(dollars * 100 - result.spentCents);
          for (const pick of result.picks) {
            expect(pick.reasons.length).toBeGreaterThan(0);
            expect(pick.offer.inStock).toBe(true);
          }
        }
      }
    }
  });

  it("picks the digital PS5 on an entry budget and skips the disc edition", () => {
    const result = recommend(
      request({ budgetCents: 55000, platform: "ps5", preference: "competitive" }),
      catalog,
    );
    expect(result.tier.id).toBe("entry");
    expect(result.picks[0]?.product.slug).toBe("sony-ps5-slim-digital");
    expect(result.spentCents).toBeLessThanOrEqual(55000);
  });

  it("prefers the disc PS5 and a cinematic screen when the budget can carry both", () => {
    const result = recommend(
      request({ budgetCents: 180000, platform: "ps5", preference: "cinematic" }),
      catalog,
    );
    const consolePick = result.picks.find((pick) => pick.category === "console");
    const display = result.picks.find((pick) => pick.category === "display");
    expect(consolePick?.product.slug).toBe("sony-ps5-slim-disc");
    expect(display?.product.bias).toBe("cinematic");
  });

  it("prefers a competitive monitor over a TV for a competitive PS5 build", () => {
    const result = recommend(
      request({ budgetCents: 140000, platform: "ps5", preference: "competitive" }),
      catalog,
    );
    const display = result.picks.find((pick) => pick.category === "display");
    expect(display?.product.bias).toBe("competitive");
  });

  it("does not recommend a console for pc-later and says the game is console-only", () => {
    const result = recommend(
      request({ budgetCents: 80000, platform: "pc-later", preference: "balanced" }),
      catalog,
    );
    expect(result.picks.some((pick) => pick.category === "console")).toBe(false);
    expect(result.notes.join(" ")).toMatch(/console-only/i);
    for (const pick of result.picks) {
      expect(pick.product.platforms).toContain("pc");
    }
  });

  it("drops owned categories and can still buy the rest", () => {
    const withHeadset = recommend(request({ budgetCents: 120000, preference: "balanced" }), catalog);
    const owned = recommend(
      request({ budgetCents: 120000, preference: "balanced", owned: ["headset", "console"] }),
      catalog,
    );
    expect(owned.picks.some((pick) => pick.category === "console" || pick.category === "headset")).toBe(
      false,
    );
    const headsetAllocation = withHeadset.picks.find((pick) => pick.category === "headset");
    expect(headsetAllocation).toBeDefined();
    expect(owned.spentCents).toBeLessThanOrEqual(120000);
  });

  it("does not buy a chair unless asked, and will not buy one that exceeds the budget", () => {
    const plain = recommend(request({ budgetCents: 250000, preference: "cinematic" }), catalog);
    expect(plain.picks.some((pick) => pick.category === "chair")).toBe(false);
    const withChair = recommend(
      request({ budgetCents: 250000, preference: "cinematic", extras: ["chair"] }),
      catalog,
    );
    expect(withChair.picks.some((pick) => pick.category === "chair")).toBe(true);
    const tight = recommend(
      request({ budgetCents: 40000, platform: "pc-later", extras: ["chair"] }),
      catalog,
    );
    expect(tight.picks.some((pick) => pick.category === "chair" && pick.offer.priceCents > 40000)).toBe(
      false,
    );
  });

  it("reports a console gap when the budget cannot reach a PS5", () => {
    const result = recommend(request({ budgetCents: 30000, platform: "ps5" }), catalog);
    expect(result.picks.some((pick) => pick.category === "console")).toBe(false);
    expect(result.gaps.some((gap) => gap.category === "console")).toBe(true);
  });

  it("keeps Xbox storage on Xbox hardware", () => {
    const result = recommend(
      request({ budgetCents: 160000, platform: "xbox", preference: "balanced" }),
      catalog,
    );
    const storage = result.picks.find((pick) => pick.category === "storage");
    if (storage) {
      expect(storage.product.platforms).toContain("xbox");
      expect(storage.product.platforms).not.toContain("ps5");
    }
  });

  it("breaks score ties by lower price, then slug", () => {
    const fixture = [item("b-choice", "display", 80, 20000), item("a-choice", "display", 80, 20000)];
    const result = recommend(
      request({ budgetCents: 20000, platform: "pc-later", preference: "balanced", owned: ["headset", "controller", "storage"] }),
      fixture,
    );
    expect(result.picks.map((pick) => pick.product.slug)).toEqual(["a-choice"]);
  });
});

function item(slug: string, category: Category, quality: number, priceCents: number): Product {
  const platforms: Platform[] = ["ps5", "xbox", "pc"];
  return {
    slug,
    name: slug,
    brand: "Fixture",
    category,
    platforms,
    bias: "neutral",
    quality,
    summary: "Fixture product.",
    specs: [],
    sampleNote: "Sample.",
    offers: [
      {
        id: `${slug}-amazon`,
        productSlug: slug,
        retailer: "amazon",
        program: "amazon",
        priceCents,
        seedPriceCents: priceCents,
        currency: "USD",
        url: "https://www.amazon.com/s?k=fixture",
        inStock: true,
        externalSku: `sample-${slug}`,
        lastCheckedAt: "2026-11-18T15:00:00.000Z",
        history: [{ priceCents, recordedAt: "2026-11-18T15:00:00.000Z" }],
      },
    ],
  };
}
