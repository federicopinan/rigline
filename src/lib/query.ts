import {
  CATEGORIES,
  PLATFORM_CHOICES,
  PREFERENCES,
  type BuildRequest,
  type Category,
  type PlatformChoice,
  type Preference,
} from "@/lib/types";

export type SearchParams = Record<string, string | string[] | undefined>;

export type ParseResult =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ok"; request: BuildRequest };

const MIN_DOLLARS = 100;
const MAX_DOLLARS = 8000;

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function manyParams(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : [value];
  return parts
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseBuildQuery(params: SearchParams): ParseResult {
  const keys = Object.keys(params);
  const budgetRaw = firstParam(params.budget)?.trim();
  if (!budgetRaw && keys.length === 0) return { status: "empty" };
  if (!budgetRaw) return { status: "error", message: "Enter a budget in US dollars." };
  if (!/^\d+$/.test(budgetRaw)) {
    return { status: "error", message: "Budget has to be a whole number of dollars." };
  }
  const dollars = Number(budgetRaw);
  if (dollars < MIN_DOLLARS || dollars > MAX_DOLLARS) {
    return {
      status: "error",
      message: `Budget must be between $${MIN_DOLLARS} and $${MAX_DOLLARS.toLocaleString("en-US")}.`,
    };
  }

  const platformRaw = firstParam(params.platform)?.trim() || "ps5";
  const platform = platformRaw === "pc" ? "pc-later" : platformRaw;
  if (!isPlatform(platform)) {
    return { status: "error", message: "Platform must be PS5, Xbox Series, or PC later." };
  }

  const playRaw = firstParam(params.play)?.trim() || "balanced";
  if (!isPreference(playRaw)) {
    return { status: "error", message: "Play style must be competitive, cinematic, or balanced." };
  }

  const currency = firstParam(params.currency)?.trim();
  if (currency && currency.toUpperCase() !== "USD") {
    return { status: "error", message: "This builder prices everything in USD." };
  }

  const owned: Category[] = [];
  for (const value of manyParams(params.own)) {
    if (!isCategory(value)) {
      return { status: "error", message: `Unknown gear category "${value}".` };
    }
    if (!owned.includes(value)) owned.push(value);
  }

  const extras: Array<"chair" | "desk"> = [];
  for (const value of manyParams(params.extras)) {
    if (value !== "chair" && value !== "desk") {
      return { status: "error", message: `Unknown extra "${value}". Use chair or desk.` };
    }
    if (!extras.includes(value)) extras.push(value);
  }

  return {
    status: "ok",
    request: {
      budgetCents: dollars * 100,
      platform,
      preference: playRaw,
      owned,
      extras,
    },
  };
}

export function toSearchParams(request: BuildRequest): string {
  const params = new URLSearchParams();
  params.set("budget", String(request.budgetCents / 100));
  params.set("platform", request.platform);
  params.set("play", request.preference);
  params.set("currency", "USD");
  if (request.owned.length > 0) params.set("own", request.owned.join(","));
  if (request.extras.length > 0) params.set("extras", request.extras.join(","));
  return params.toString();
}

function isPlatform(value: string): value is PlatformChoice {
  return PLATFORM_CHOICES.some((choice) => choice === value);
}

function isPreference(value: string): value is Preference {
  return PREFERENCES.some((choice) => choice === value);
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}
