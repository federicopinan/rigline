import type { MetadataRoute } from "next";
import { seedProducts } from "@/lib/catalog";
import { readGuides } from "@/lib/guides";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const guides = readGuides();
  const products = seedProducts();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/disclosure`, changeFrequency: "yearly", priority: 0.3 },
    ...products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...guides.map((guide) => ({
      url: `${base}/guides/${guide.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
