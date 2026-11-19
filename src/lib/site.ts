export const SITE_NAME = "Rigline";

export const SITE_DESCRIPTION =
  "Build a GTA 6 setup for PS5 or Xbox Series from a budget. Sample prices, explained picks, and retailer links.";

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3847";
  return configured.replace(/\/$/, "");
}
