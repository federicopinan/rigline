import { describe, expect, it } from "vitest";
import { buildAffiliateUrl } from "@/lib/affiliate";

const merchant = "https://www.amazon.com/s?k=PlayStation%205";

describe("buildAffiliateUrl", () => {
  it("sets the Amazon Associates tag and keeps the existing query", () => {
    const result = buildAffiliateUrl(merchant, "amazon", { amazonAssociateTag: "rigline-20" });
    const url = new URL(result);
    expect(url.searchParams.get("k")).toBe("PlayStation 5");
    expect(url.searchParams.get("tag")).toBe("rigline-20");
  });

  it("replaces an existing Amazon tag", () => {
    const result = buildAffiliateUrl(`${merchant}&tag=old-20`, "amazon", {
      amazonAssociateTag: "rigline-20",
    });
    expect(new URL(result).searchParams.get("tag")).toBe("rigline-20");
  });

  it("leaves the merchant URL alone when the tag is missing or blank", () => {
    expect(buildAffiliateUrl(merchant, "amazon", {})).toBe(new URL(merchant).toString());
    expect(buildAffiliateUrl(merchant, "amazon", { amazonAssociateTag: "  " })).toBe(
      new URL(merchant).toString(),
    );
  });

  it("appends aff_id for Best Buy and Walmart when the env value is an id", () => {
    const bestBuy = buildAffiliateUrl("https://www.bestbuy.com/site/searchpage.jsp?st=ps5", "bestbuy", {
      bestBuyAffiliateId: "bb-123",
    });
    expect(new URL(bestBuy).searchParams.get("aff_id")).toBe("bb-123");
    expect(new URL(bestBuy).searchParams.get("st")).toBe("ps5");

    const walmart = buildAffiliateUrl("https://www.walmart.com/search?q=ps5", "walmart", {
      walmartAffiliateId: "wm-9",
    });
    expect(new URL(walmart).searchParams.get("aff_id")).toBe("wm-9");
  });

  it("wraps the merchant URL when the env value is a deep-link template", () => {
    const result = buildAffiliateUrl("https://www.bestbuy.com/site/searchpage.jsp?st=ps5", "bestbuy", {
      bestBuyAffiliateId: "https://partners.example/c/99?u={url}",
    });
    expect(result.startsWith("https://partners.example/c/99?u=")).toBe(true);
    const wrapped = new URL(result);
    const inner = decodeURIComponent(wrapped.searchParams.get("u") ?? "");
    expect(inner).toBe("https://www.bestbuy.com/site/searchpage.jsp?st=ps5");
  });

  it("does not attach tags for program none", () => {
    const result = buildAffiliateUrl("https://example.com/item?id=1", "none", {
      amazonAssociateTag: "rigline-20",
      bestBuyAffiliateId: "bb-123",
    });
    expect(new URL(result).searchParams.get("tag")).toBeNull();
    expect(new URL(result).searchParams.get("aff_id")).toBeNull();
  });

  it("rejects a merchant URL that is not absolute", () => {
    expect(() => buildAffiliateUrl("/relative", "amazon", { amazonAssociateTag: "rigline-20" })).toThrow();
  });
});
