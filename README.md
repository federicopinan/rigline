# Rigline

Rigline is a GTA 6 gaming setup builder. You enter a budget in US dollars, pick PS5, Xbox Series, or "PC later," and optionally say what you already own. The app returns a console, a screen, a headset, and the accessories that still fit, with a written reason for each pick.

GTA 6 is console-only at launch. The builder will not recommend a PC as if the game were on it. "PC later" only returns gear you can keep using.

Every price in the catalog is a **seeded sample**. It is not a live Amazon, Best Buy, Walmart, or Target quote. The UI says so on every page.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

No environment variables are required. With Supabase unset, the app reads `src/data/catalog.json`. Click logs and mock price updates are written to `data/runtime/`, which is gitignored.

```bash
npm test          # Vitest: recommendation engine, affiliate URLs, cron auth, price selection
npm run typecheck
npm run lint
npm run build
```

Regenerate the JSON catalog and the SQL seed after editing `scripts/build-catalog.mjs`:

```bash
npm run catalog
```

## How a setup is chosen

The engine in `src/lib/recommend.ts` is a pure function. Same budget, same catalog, same list.

1. The budget falls into a tier: under $600, $600–$999, $1,000–$1,799, or $1,800 and up. The labels on the site match those bands.
2. Unless you already own a console, or you chose PC later, a console is picked first. Entry tier caps that slot near $460 so a $499 disc console cannot consume a sub-$600 budget. Higher tiers allow the standard console.
3. What remains is split by play style. Cinematic gives the screen about 58% of the remainder. Competitive keeps more for the headset and controller. Chair and desk are omitted unless you check them, and the other weights are then normalized.
4. Inside a slot, products that match the platform are scored on quality, a preference bonus, and a penalty for spending past the allocation. Ties break on lower price, then slug. A pick cannot push the running total over the budget.

The result page repeats those numbers. The shareable URL is the query string, for example `/build?budget=1500&platform=ps5&play=cinematic&currency=USD`.

## Environment variables

Copy `.env.example` to `.env.local`. Nothing in the repo contains a real secret.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for metadata, sitemap, and Open Graph. Defaults to `http://localhost:3847`. |
| `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` | No | Supabase project URL. Both empty means the local seed is used. |
| `SUPABASE_SECRET_KEY` | No | Server key for reads, price writes, and click inserts. `SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy alias. Never expose this to the browser. |
| `AMAZON_ASSOCIATE_TAG` | No | Amazon Associates `tag` parameter, appended on `/go/[offerId]`. |
| `BESTBUY_AFFILIATE_ID` | No | Affiliate id appended as `aff_id`, or a deep-link template containing `{url}`. |
| `WALMART_AFFILIATE_ID` | No | Same pattern as Best Buy. |
| `TARGET_AFFILIATE_ID` | No | Same pattern as Best Buy. |
| `CRON_SECRET` | For the cron route | Vercel sends `Authorization: Bearer <CRON_SECRET>`. The route returns 401 without it. |
| `PRICE_PROVIDER` | No | `mock` (default behavior when unset via `auto`), `auto`, `amazon`, or `bestbuy`. |
| `PRICE_STALE_HOURS` | No | Offers newer than this are skipped. Default 12. |
| `PRICE_BATCH_SIZE` | No | Max offers per run. Default 100. |
| `AMAZON_PAAPI_ACCESS_KEY` | No | Stub only. Not used to call Amazon. |
| `AMAZON_PAAPI_SECRET_KEY` | No | Stub only. |
| `AMAZON_PAAPI_PARTNER_TAG` | No | Stub only. |
| `AMAZON_PAAPI_HOST` | No | Documented host for a future GetItems call. Default `webservices.amazon.com`. |
| `BESTBUY_API_KEY` | No | Stub only. Not used to call Best Buy. |

`auto` uses the mock provider unless the PA-API trio or `BESTBUY_API_KEY` is set. Those adapters are stubs: they skip the offer and refuse to invent a "live" price. Leave `PRICE_PROVIDER=mock` until a real client exists.

## Database

Schema: `supabase/migrations/20261119180000_init_catalog.sql`.

Sample rows: `supabase/migrations/20261119180100_seed_catalog.sql` (same SQL as `supabase/seed.sql`).

Apply both in the Supabase SQL editor, schema first. Row Level Security is on. `anon` and `authenticated` can select products, offers, and price history. They cannot insert or update. Click logs and price writes use the secret key, which bypasses RLS.

The app talks to Postgres through `supabase-js` on the server. There is no browser client and no auth, because the catalog is public and writes are limited to the cron route and the redirect route.

## Price updates

`vercel.json` schedules one daily GET of `/api/cron/refresh-prices` at 08:00 UTC. That matches the once-a-day cron limit on Vercel's Hobby plan. Confirm the current limit in the Vercel docs before you depend on it. The config key is `schedules`, which is the current replacement for the older `crons` key.

The route checks `CRON_SECRET`, loads offers, and refreshes only those whose `last_checked_at` is older than `PRICE_STALE_HOURS`, up to `PRICE_BATCH_SIZE`, oldest first. The mock provider moves the price by a deterministic −4% to +4% around `seed_price_cents` for that UTC day, so a second run the same day does not drift. A new point is stored in `price_history` (or in `data/runtime/offers.json` when there is no database). The catalog cache tag is expired so the next page view can pick up the change.

Local check:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3847/api/cron/refresh-prices
```

## Affiliate links

Product and result pages link to `/go/[offerId]` with `rel="sponsored nofollow"`. The route looks up the offer, appends the tag, logs the click, and returns a 302. The destination is taken from the catalog, not from a query parameter, so the route is not an open redirect.

A disclosure banner is in the header of every page, and `/disclosure` spells out the sample-price rule.

## Deploy on the free tiers

1. Push the repo to GitHub.
2. Import it in Vercel. Framework preset is Next.js. No extra build command.
3. Set the env vars you actually have. `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL` are the ones that matter on day one. Leave Supabase empty until the database exists; the seed still renders.
4. Create a Supabase project on the free tier. Run the two SQL files. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` on Vercel and redeploy.
5. Add the cron secret in Vercel as well. The daily schedule in `vercel.json` is picked up on deploy.
6. Point `NEXT_PUBLIC_SITE_URL` at the production origin, without a trailing slash.

Guides are static files in `content/guides`. Product pages are prerendered from `generateStaticParams`. Catalog reads use `use cache` with a one-hour lifetime and the `catalog` tag, so a cron run does not require a rebuild.

## Estimated monthly cost

| Piece | Typical cost |
| --- | --- |
| Vercel Hobby | $0 for a personal, non-commercial deploy. Bandwidth and function limits apply. |
| Vercel Pro | $20 per user per month once the project is commercial. Affiliate revenue is commercial. Read the current Hobby terms before you earn from the site. |
| Supabase free | $0 inside the free database, egress, and file limits. Free projects pause after a period of inactivity, which also pauses the cron's ability to write. |
| Domain | Optional. About $10–$15 a year. |
| Amazon PA-API and Best Buy API | $0 to call. Access is gated on an approved affiliate account, and PA-API has its own request rules. This repo does not call them yet. |

A personal demo with the local seed or a small Supabase project stays at **$0 per month**. A site that earns affiliate fees should budget **about $20 per month** for Vercel Pro, plus a domain, until traffic forces a larger database or more cron frequency.

## Monetization

Honest version: this MVP is not ready to charge anyone, and it is not ready to present sample prices as current deals.

**Affiliate programs.** Amazon Associates is the straightforward first program. You need a real site, you disclose the relationship (this app already does), and you need a small number of qualifying sales inside the approval window or the account closes. If you display Amazon prices as current, the Associates operating agreement expects you to pull them from the Product Advertising API and to refresh them on Amazon's schedule. Do not remove the "sample price" label until that adapter is real. Best Buy and Walmart pay through affiliate networks such as Impact. They review the site and they reject thin coupon pages. Paste the network's deep-link template into `BESTBUY_AFFILIATE_ID` or `WALMART_AFFILIATE_ID` using `{url}` once you are approved. A bare `aff_id` parameter is only a placeholder.

**Display ads.** Networks want original pages and some traffic before they approve you. A new site full of sample prices will not earn meaningful RPM, and a large gaming network usually wants tens of thousands of sessions a month. Confirm the current cutoff. Ads on top of a builder people do not trust will also lower the affiliate click-through you actually want.

**Sponsored placements.** A labeled slot is reasonable later: a `featured` flag that is rendered as "Sponsored" and excluded from the score, so a paid row cannot outrank a better fit. That flag is not in this version. Do not quietly boost a score.

**Email and price-drop alerts.** A small list (Buttondown or Kit on their free tiers) is reasonable once you have something true to send, such as a guide or a real price change. Premium alerts are a plausible later product only after a live provider is writing `price_history`. Charging for alerts on the mock wobble would be selling noise. Do not do that.

What is realistic in the first months is a handful of affiliate commissions if the guides rank and the builder is useful. It is not a salary, and it is not a reason to pretend the seed prices are live.

## Project map

- `src/lib/recommend.ts` — budget split and scoring
- `src/lib/affiliate.ts` — outbound URL builder
- `src/lib/pricing/` — mock provider, Amazon and Best Buy stubs, stale-offer selection
- `src/app/go/[offerId]/route.ts` — redirect and click log
- `src/app/api/cron/refresh-prices/route.ts` — protected refresh
- `content/guides/` — the three starter guides
- `scripts/build-catalog.mjs` — catalog JSON and SQL seed
