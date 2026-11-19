import { cacheLife, cacheTag } from "next/cache";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type GuideFaq = {
  q: string;
  a: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  published: string;
  products: string[];
  faqs: GuideFaq[];
  body: string;
};

const GUIDE_DIR = path.join(process.cwd(), "content", "guides");

/** gray-matter parses unquoted YAML dates into Date objects. Always store text. */
function asText(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return fallback;
}

export function readGuides(): Guide[] {
  return readdirSync(GUIDE_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = readFileSync(path.join(GUIDE_DIR, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data as {
        title?: string;
        description?: string;
        published?: string;
        products?: string[];
        faqs?: GuideFaq[];
      };
      return {
        slug: file.replace(/\.md$/, ""),
        title: asText(data.title, file),
        description: asText(data.description, ""),
        published: asText(data.published, "2026-11-19"),
        products: data.products ?? [],
        faqs: (data.faqs ?? []).map((faq) => ({ q: asText(faq.q, ""), a: asText(faq.a, "") })),
        body: parsed.content.trim(),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getGuides(): Promise<Guide[]> {
  "use cache";
  cacheLife("days");
  cacheTag("guides");
  return readGuides();
}

export async function getGuide(slug: string): Promise<Guide | undefined> {
  const guides = await getGuides();
  return guides.find((guide) => guide.slug === slug);
}
