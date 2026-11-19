import { formatUsd } from "@/lib/money";
import {
  SAMPLE_PRICE_NOTE,
  TIERS,
  type Bias,
  type BuildRequest,
  type Category,
  type Offer,
  type Platform,
  type Preference,
  type Product,
  type TierId,
} from "@/lib/types";

const ACCESSORY_ORDER = [
  "display",
  "headset",
  "controller",
  "storage",
  "chair",
  "desk",
] as const satisfies readonly Exclude<Category, "console">[];

type Accessory = (typeof ACCESSORY_ORDER)[number];

/**
 * Share of the post-console budget. Chair and desk are dropped unless the
 * player opts in, then the remaining weights are normalized.
 */
const WEIGHTS: Record<Preference, Record<Accessory, number>> = {
  competitive: { display: 46, headset: 20, controller: 16, storage: 10, chair: 5, desk: 3 },
  cinematic: { display: 58, headset: 14, controller: 8, storage: 10, chair: 6, desk: 4 },
  balanced: { display: 50, headset: 18, controller: 12, storage: 10, chair: 6, desk: 4 },
};

const CATEGORY_LABEL: Record<Category, string> = {
  console: "Console",
  display: "Screen",
  headset: "Headset",
  controller: "Controller",
  storage: "Storage",
  chair: "Chair",
  desk: "Desk",
};

export type SetupPick = {
  category: Category;
  product: Product;
  offer: Offer;
  allocationCents: number;
  ceilingCents: number;
  score: number;
  stretched: boolean;
  reasons: string[];
};

export type SetupGap = {
  category: Category;
  reasons: string[];
};

export type Tier = {
  id: TierId;
  label: string;
};

export type Recommendation = {
  request: BuildRequest;
  tier: Tier;
  picks: SetupPick[];
  gaps: SetupGap[];
  notes: string[];
  /** Plain-language description of the split. Shown in the result page. */
  explanation: string[];
  spentCents: number;
  leftoverCents: number;
};

type Ranked = {
  product: Product;
  offer: Offer;
  score: number;
};

export function tierFor(budgetCents: number): Tier {
  const match = TIERS.find((tier) => budgetCents >= tier.minCents && budgetCents <= tier.maxCents);
  if (!match) {
    return { id: "flagship", label: "$1,800+" };
  }
  return { id: match.id, label: match.label };
}

export function categoryLabel(category: Category): string {
  return CATEGORY_LABEL[category];
}

/** Lowest in-stock offer. Out-of-stock rows stay on the product page but do not win a slot. */
export function lowestInStockOffer(product: Product): Offer | null {
  const available = product.offers.filter((offer) => offer.inStock);
  if (available.length === 0) return null;
  return [...available].sort(
    (a, b) => a.priceCents - b.priceCents || a.retailer.localeCompare(b.retailer),
  )[0];
}

export function sortedOffers(product: Product): Offer[] {
  return [...product.offers].sort(
    (a, b) => a.priceCents - b.priceCents || a.retailer.localeCompare(b.retailer),
  );
}

function biasBonus(bias: Bias, preference: Preference): number {
  if (preference === "balanced") {
    return bias === "neutral" ? 8 : 4;
  }
  if (bias === "neutral") return 6;
  if (bias === preference) return 18;
  return -8;
}

function overPenalty(priceCents: number, idealCents: number): number {
  if (idealCents <= 0 || priceCents <= idealCents) return 0;
  return ((priceCents - idealCents) / idealCents) * 40;
}

function scoreProduct(product: Product, priceCents: number, idealCents: number, preference: Preference): number {
  return product.quality + biasBonus(product.bias, preference) - overPenalty(priceCents, idealCents);
}

function consoleCeiling(tier: TierId, budgetCents: number): number {
  switch (tier) {
    case "entry":
      return Math.min(budgetCents, 46000);
    case "core":
      return Math.min(budgetCents, 52000);
    case "high":
      return Math.min(budgetCents, 56000);
    case "flagship":
      return Math.min(budgetCents, 56000);
    default: {
      const unreachable: never = tier;
      return unreachable;
    }
  }
}

function consoleFrugal(tier: TierId): number {
  switch (tier) {
    case "entry":
      return 22;
    case "core":
      return 10;
    case "high":
      return 4;
    case "flagship":
      return 4;
    default: {
      const unreachable: never = tier;
      return unreachable;
    }
  }
}

function gearPlatform(choice: BuildRequest["platform"]): Platform | null {
  switch (choice) {
    case "ps5":
      return "ps5";
    case "xbox":
      return "xbox";
    case "pc-later":
      return "pc";
    default: {
      const unreachable: never = choice;
      return unreachable;
    }
  }
}

function preferenceSentence(preference: Preference, bias: Bias): string {
  if (preference === "balanced") {
    return "Balanced play does not chase a specialist, so bias is a small tie-break and quality does most of the work.";
  }
  if (bias === preference) {
    return `${capitalize(preference)} preference matches this product's ${bias} bias, so it gets a score bonus.`;
  }
  if (bias === "neutral") {
    return `${capitalize(preference)} preference gives a neutral product a small bonus, smaller than a specialist match.`;
  }
  return `${capitalize(preference)} preference penalizes a ${bias} product, so it has to be clearly better on quality or price to win.`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function retailerName(retailer: string): string {
  switch (retailer) {
    case "amazon":
      return "Amazon";
    case "bestbuy":
      return "Best Buy";
    case "walmart":
      return "Walmart";
    case "target":
      return "Target";
    default:
      return retailer;
  }
}

function rankConsoles(
  eligible: Product[],
  ceilingCents: number,
  poolCents: number,
  preference: Preference,
  frugal: number,
): { chosen: Ranked | null; runnerUp: Ranked | null; stretched: boolean; cheapest: Offer | null } {
  const priced = eligible.flatMap((product) => {
    const offer = lowestInStockOffer(product);
    return offer ? [{ product, offer }] : [];
  });
  const cheapest =
    priced
      .map((row) => row.offer)
      .sort((a, b) => a.priceCents - b.priceCents || a.retailer.localeCompare(b.retailer))[0] ?? null;

  const scoreOf = (row: { product: Product; offer: Offer }): number =>
    row.product.quality +
    biasBonus(row.product.bias, preference) -
    (row.offer.priceCents / Math.max(ceilingCents, 1)) * frugal;

  let pool = priced.filter(
    (row) => row.offer.priceCents <= ceilingCents && row.offer.priceCents <= poolCents,
  );
  let stretched = false;
  if (pool.length === 0) {
    const relaxed = Math.min(poolCents, Math.round(ceilingCents * 1.15));
    pool = priced.filter((row) => row.offer.priceCents <= relaxed);
    stretched = pool.length > 0;
  }

  const scored = pool
    .map((row) => ({ ...row, score: scoreOf(row) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.offer.priceCents - b.offer.priceCents ||
        a.product.slug.localeCompare(b.product.slug),
    );

  return {
    chosen: scored[0] ?? null,
    runnerUp: scored[1] ?? null,
    stretched,
    cheapest,
  };
}

function rankEligible(
  eligible: Product[],
  ceilingCents: number,
  idealCents: number,
  poolCents: number,
  preference: Preference,
  allowStretch: boolean,
): { chosen: Ranked | null; runnerUp: Ranked | null; stretched: boolean; cheapest: Offer | null } {
  const priced = eligible.flatMap((product) => {
    const offer = lowestInStockOffer(product);
    return offer ? [{ product, offer }] : [];
  });
  const cheapest = priced
    .map((row) => row.offer)
    .sort((a, b) => a.priceCents - b.priceCents || a.retailer.localeCompare(b.retailer))[0] ?? null;

  let pool = priced.filter(
    (row) => row.offer.priceCents <= ceilingCents && row.offer.priceCents <= poolCents,
  );
  let stretched = false;
  if (pool.length === 0 && allowStretch) {
    pool = priced.filter((row) => {
      const price = row.offer.priceCents;
      return (
        price <= poolCents &&
        price <= Math.round(Math.max(idealCents, 1) * 2.5) &&
        price <= Math.round(poolCents * 0.85)
      );
    });
    stretched = pool.length > 0;
  }

  const scored = pool
    .map((row) => ({
      ...row,
      score: scoreProduct(row.product, row.offer.priceCents, idealCents, preference),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.offer.priceCents - b.offer.priceCents ||
        a.product.slug.localeCompare(b.product.slug),
    );

  return {
    chosen: scored[0] ?? null,
    runnerUp: scored[1] ?? null,
    stretched,
    cheapest,
  };
}

function pickReasons(input: {
  category: Category;
  chosen: Ranked;
  runnerUp: Ranked | null;
  allocationCents: number;
  ceilingCents: number;
  stretched: boolean;
  preference: Preference;
  platform: BuildRequest["platform"];
}): string[] {
  const { chosen } = input;
  const reasons = [
    `${categoryLabel(input.category)} allocation is ${formatUsd(input.allocationCents)}. The pick ceiling for this slot is ${formatUsd(input.ceilingCents)}.`,
    preferenceSentence(input.preference, chosen.product.bias),
    `Quality score ${chosen.product.quality} out of 100. Builder score ${chosen.score.toFixed(1)} after the preference adjustment and any over-allocation penalty.`,
  ];
  if (input.runnerUp) {
    reasons.push(
      `Next in line was ${input.runnerUp.product.name} at ${formatUsd(input.runnerUp.offer.priceCents)} (score ${input.runnerUp.score.toFixed(1)}).`,
    );
  }
  if (input.stretched) {
    reasons.push(
      "Nothing fit the ideal allocation. This pick is still inside 2.5× that allocation and leaves at least 15% of the money that was left.",
    );
  }
  if (input.platform === "pc-later") {
    reasons.push(
      "Listed because it works on PC. It does not play GTA 6 until a PC version exists.",
    );
  }
  reasons.push(
    `Lowest in-stock sample offer is ${formatUsd(chosen.offer.priceCents)} at ${retailerName(chosen.offer.retailer)}. ${SAMPLE_PRICE_NOTE}`,
  );
  return reasons;
}

/**
 * Deterministic setup builder.
 * Same request and catalog always return the same slugs, in category order.
 * A pick is never allowed to push the running total over the budget.
 */
export function recommend(request: BuildRequest, products: Product[]): Recommendation {
  const tier = tierFor(request.budgetCents);
  const notes: string[] = [SAMPLE_PRICE_NOTE];
  const explanation: string[] = [];
  const picks: SetupPick[] = [];
  const gaps: SetupGap[] = [];
  const platform = gearPlatform(request.platform);

  explanation.push(
    `Budget ${formatUsd(request.budgetCents)} lands in the ${tier.label} tier.`,
  );

  let pool = request.budgetCents;

  if (request.platform === "pc-later") {
    notes.push(
      "GTA 6 is console-only at launch, on PS5 and Xbox Series. This list has no console and no PC, because a PC version is not available yet. The picks are gear you can keep using when it arrives.",
    );
    explanation.push("PC-later closes the console category. The full budget is split across carry-over gear.");
  } else if (request.owned.includes("console")) {
    notes.push("You already have a console, so that money stays on the rest of the setup.");
    explanation.push("Console skipped because it is in the owned list.");
  } else if (platform) {
    const ceiling = consoleCeiling(tier.id, request.budgetCents);
    const frugal = consoleFrugal(tier.id);
    const eligible = products.filter(
      (item) => item.category === "console" && item.platforms.includes(platform),
    );
    const ranked = rankConsoles(eligible, ceiling, pool, request.preference, frugal);
    explanation.push(
      `${capitalize(request.platform)} console ceiling for this tier is ${formatUsd(ceiling)}. Entry caps it near $460 so a disc console does not eat a sub-$600 budget. Higher tiers allow the standard $499 box.`,
    );
    if (ranked.chosen) {
      pool -= ranked.chosen.offer.priceCents;
      picks.push({
        category: "console",
        product: ranked.chosen.product,
        offer: ranked.chosen.offer,
        allocationCents: ceiling,
        ceilingCents: ranked.stretched
          ? Math.min(request.budgetCents, Math.round(ceiling * 1.15))
          : ceiling,
        score: ranked.chosen.score,
        stretched: ranked.stretched,
        reasons: pickReasons({
          category: "console",
          chosen: ranked.chosen,
          runnerUp: ranked.runnerUp,
          allocationCents: ceiling,
          ceilingCents: ceiling,
          stretched: ranked.stretched,
          preference: request.preference,
          platform: request.platform,
        }),
      });
    } else {
      const cheapest = ranked.cheapest;
      gaps.push({
        category: "console",
        reasons: [
          cheapest
            ? `The cheapest in-stock ${request.platform === "ps5" ? "PS5" : "Xbox"} in the sample catalog is ${formatUsd(cheapest.priceCents)}, which is above the ${formatUsd(ceiling)} ceiling and the stretch to ${formatUsd(Math.round(ceiling * 1.15))}.`
            : `No ${request.platform === "ps5" ? "PS5" : "Xbox"} console is in stock in the sample catalog.`,
          "Raise the budget, or mark a console as owned if you already have one.",
        ],
      });
    }
  }

  const ownedAccessories = ACCESSORY_ORDER.filter((category) => request.owned.includes(category));
  if (ownedAccessories.length > 0) {
    notes.push(
      `Left out because you already own them: ${ownedAccessories.map(categoryLabel).join(", ")}.`,
    );
  }

  const active = ACCESSORY_ORDER.filter((category) => {
    if (request.owned.includes(category)) return false;
    if (category === "chair" || category === "desk") return request.extras.includes(category);
    return true;
  });

  const weightSum = active.reduce((sum, category) => sum + WEIGHTS[request.preference][category], 0);
  const ideals = new Map<Accessory, number>();
  if (weightSum > 0 && pool > 0) {
    for (const category of active) {
      ideals.set(category, Math.round((pool * WEIGHTS[request.preference][category]) / weightSum));
    }
  }

  const postConsole = pool;
  if (active.length > 0) {
    const bits = active.map(
      (category) =>
        `${categoryLabel(category)} ${formatUsd(ideals.get(category) ?? 0)} (${WEIGHTS[request.preference][category]} weight)`,
    );
    explanation.push(
      `${formatUsd(postConsole)} remains after the console decision. ${capitalize(request.preference)} weights, with chair and desk removed unless you asked for them: ${bits.join("; ")}.`,
    );
    explanation.push(
      "Each slot may spend up to 15% over its ideal, but it also holds back 55% of the later slots' ideals so the screen cannot take the headset money. A slot can stretch to 2.5× its ideal only when nothing cheaper exists and the pick leaves 15% of the remaining cash.",
    );
  } else {
    explanation.push("No accessory categories are active. Owned gear and optional chair or desk account for that.");
  }

  for (let index = 0; index < active.length; index += 1) {
    const category = active[index];
    const ideal = ideals.get(category) ?? 0;
    const later = active.slice(index + 1).reduce((sum, laterCategory) => sum + (ideals.get(laterCategory) ?? 0), 0);
    const reserve = Math.round(later * 0.55);
    const ceiling = Math.max(0, Math.min(pool - reserve, Math.round(ideal * 1.15)));
    const eligible =
      platform === null
        ? []
        : products.filter((item) => item.category === category && item.platforms.includes(platform));
    const ranked = rankEligible(eligible, ceiling, ideal, pool, request.preference, true);
    if (!ranked.chosen) {
      const cheapest = ranked.cheapest;
      gaps.push({
        category,
        reasons: [
          cheapest
            ? `The cheapest in-stock ${categoryLabel(category).toLowerCase()} for this platform is ${formatUsd(cheapest.priceCents)}. The slot ceiling is ${formatUsd(ceiling)} with ${formatUsd(pool)} left.`
            : `No in-stock ${categoryLabel(category).toLowerCase()} in the sample catalog matches this platform.`,
          "The builder skips the slot instead of going over budget.",
        ],
      });
      continue;
    }
    const chosen = ranked.chosen;
    pool -= chosen.offer.priceCents;
    picks.push({
      category,
      product: chosen.product,
      offer: chosen.offer,
      allocationCents: ideal,
      ceilingCents: ceiling,
      score: chosen.score,
      stretched: ranked.stretched,
      reasons: pickReasons({
        category,
        chosen,
        runnerUp: ranked.runnerUp,
        allocationCents: ideal,
        ceilingCents: ceiling,
        stretched: ranked.stretched,
        preference: request.preference,
        platform: request.platform,
      }),
    });
  }

  const spentCents = picks.reduce((sum, pick) => sum + pick.offer.priceCents, 0);
  const leftoverCents = request.budgetCents - spentCents;
  if (leftoverCents >= 5000) {
    notes.push(
      `${formatUsd(leftoverCents)} is unspent. The builder leaves it rather than forcing a product that breaks a slot.`,
    );
  }
  if (request.extras.length === 0) {
    explanation.push(
      "Chair and desk stay out until you check them. Their weights are removed and the remaining weights are normalized, so that share moves into the categories you are actually buying.",
    );
  }

  return {
    request,
    tier,
    picks,
    gaps,
    notes,
    explanation,
    spentCents,
    leftoverCents,
  };
}
