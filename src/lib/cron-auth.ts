import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Missing secret always fails closed. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  const trimmed = secret?.trim();
  if (!trimmed || !header) return false;
  const expected = Buffer.from(`Bearer ${trimmed}`);
  const actual = Buffer.from(header);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
