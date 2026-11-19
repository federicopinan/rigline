export const CATEGORIES = [
  "console",
  "display",
  "headset",
  "controller",
  "storage",
  "chair",
  "desk",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PLATFORMS = ["ps5", "xbox", "pc"] as const;

export type Platform = (typeof PLATFORMS)[number];

/** What the builder asks for. `pc-later` is not a console you can buy for launch. */
export const PLATFORM_CHOICES = ["ps5", "xbox", "pc-later"] as const;

export type PlatformChoice = (typeof PLATFORM_CHOICES)[number];

export const PREFERENCES = ["competitive", "cinematic", "balanced"] as const;

export type Preference = (typeof PREFERENCES)[number];

export const BIASES = ["competitive", "cinematic", "neutral"] as const;

export type Bias = (typeof BIASES)[number];

export const PROGRAMS = ["amazon", "bestbuy", "walmart", "target", "none"] as const;

export type AffiliateProgram = (typeof PROGRAMS)[number];

export const TIERS = [
  { id: "entry", label: "Under $600", minCents: 0, maxCents: 59999 },
  { id: "core", label: "$600–$1,000", minCents: 60000, maxCents: 99999 },
  { id: "high", label: "$1,000–$1,800", minCents: 100000, maxCents: 179999 },
  { id: "flagship", label: "$1,800+", minCents: 180000, maxCents: Number.POSITIVE_INFINITY },
] as const;

export type TierId = (typeof TIERS)[number]["id"];

export type PricePoint = {
  priceCents: number;
  recordedAt: string;
};

export type Offer = {
  id: string;
  productSlug: string;
  retailer: string;
  program: AffiliateProgram;
  /** Current sample price. The cron job may move this around `seedPriceCents`. */
  priceCents: number;
  /** Original seeded sample price. Mock refreshes wobble around this, not the last quote. */
  seedPriceCents: number;
  currency: "USD";
  url: string;
  inStock: boolean;
  externalSku: string;
  lastCheckedAt: string;
  history: PricePoint[];
};

export type Spec = {
  label: string;
  value: string;
};

export type Product = {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  platforms: Platform[];
  bias: Bias;
  /** 1–100 quality score used by the builder. Independent of price. */
  quality: number;
  summary: string;
  specs: Spec[];
  sampleNote: string;
  offers: Offer[];
};

export type BuildRequest = {
  budgetCents: number;
  platform: PlatformChoice;
  preference: Preference;
  /** Categories the player already owns and wants left out. */
  owned: Category[];
  /** Optional categories. Chair and desk are off unless listed here. */
  extras: Array<"chair" | "desk">;
};

export const SAMPLE_PRICE_NOTE =
  "Sample price for this demo. Not a live retail quote.";
