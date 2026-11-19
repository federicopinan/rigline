import type { AffiliateProgram } from "@/lib/types";

/**
 * Tags come from the environment. Nothing here is a secret default.
 *
 * Amazon Associates really does use the `tag` query parameter.
 * Best Buy and Walmart pay through affiliate networks. Those networks issue a
 * wrapped click URL. If the env value contains `{url}`, it is treated as that
 * template and the merchant URL is inserted encoded. Otherwise the id is
 * appended as `aff_id` so the outbound link is still traceable in our click
 * log. That param is not, by itself, an approved Impact deep link.
 */
export type AffiliateEnv = {
  amazonAssociateTag?: string;
  bestBuyAffiliateId?: string;
  walmartAffiliateId?: string;
  targetAffiliateId?: string;
};

export function affiliateEnvFromProcess(): AffiliateEnv {
  return {
    amazonAssociateTag: process.env.AMAZON_ASSOCIATE_TAG,
    bestBuyAffiliateId: process.env.BESTBUY_AFFILIATE_ID,
    walmartAffiliateId: process.env.WALMART_AFFILIATE_ID,
    targetAffiliateId: process.env.TARGET_AFFILIATE_ID,
  };
}

export function buildAffiliateUrl(
  merchantUrl: string,
  program: AffiliateProgram,
  env: AffiliateEnv,
): string {
  const url = new URL(merchantUrl);
  switch (program) {
    case "amazon":
      return withTag(url, env.amazonAssociateTag);
    case "bestbuy":
      return applyNetwork(url, env.bestBuyAffiliateId);
    case "walmart":
      return applyNetwork(url, env.walmartAffiliateId);
    case "target":
      return applyNetwork(url, env.targetAffiliateId);
    case "none":
      return url.toString();
    default: {
      const unreachable: never = program;
      return unreachable;
    }
  }
}

function withTag(url: URL, tag: string | undefined): string {
  const cleaned = tag?.trim();
  if (cleaned) {
    url.searchParams.set("tag", cleaned);
  }
  return url.toString();
}

function applyNetwork(url: URL, id: string | undefined): string {
  const cleaned = id?.trim();
  if (!cleaned) return url.toString();
  if (cleaned.includes("{url}")) {
    return cleaned.replaceAll("{url}", encodeURIComponent(url.toString()));
  }
  url.searchParams.set("aff_id", cleaned);
  return url.toString();
}
