import { describe, expect, it } from "vitest";
import { parseBuildQuery, toSearchParams } from "@/lib/query";
import type { BuildRequest } from "@/lib/types";

describe("build query", () => {
  it("round-trips a shareable request", () => {
    const request: BuildRequest = {
      budgetCents: 120000,
      platform: "xbox",
      preference: "cinematic",
      owned: ["headset", "console"],
      extras: ["chair"],
    };
    const params = Object.fromEntries(new URLSearchParams(toSearchParams(request)));
    const parsed = parseBuildQuery(params);
    expect(parsed).toEqual({ status: "ok", request });
  });

  it("accepts repeated own params and the pc alias", () => {
    const parsed = parseBuildQuery({
      budget: "800",
      platform: "pc",
      play: "competitive",
      own: ["headset", "storage"],
    });
    expect(parsed).toEqual({
      status: "ok",
      request: {
        budgetCents: 80000,
        platform: "pc-later",
        preference: "competitive",
        owned: ["headset", "storage"],
        extras: [],
      },
    });
  });

  it("returns an empty state when the page has no query", () => {
    expect(parseBuildQuery({})).toEqual({ status: "empty" });
  });

  it("rejects bad budgets, currencies, and categories", () => {
    expect(parseBuildQuery({ budget: "12" }).status).toBe("error");
    expect(parseBuildQuery({ budget: "1200.5" }).status).toBe("error");
    expect(parseBuildQuery({ budget: "1200", currency: "EUR" }).status).toBe("error");
    expect(parseBuildQuery({ budget: "1200", own: "mouse" }).status).toBe("error");
  });
});
