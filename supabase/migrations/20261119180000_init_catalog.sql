-- Rigline catalog schema for Supabase Postgres.
-- Prices stored here are sample data. They are not live retailer quotes.
--
-- Public reads go through RLS policies for anon and authenticated.
-- Writes (price refresh, click log) use the server secret key, which bypasses RLS.
-- There is no insert or update policy for the public roles.

create table public.products (
  slug text primary key,
  name text not null,
  brand text not null,
  category text not null,
  platforms text[] not null,
  bias text not null,
  quality smallint not null,
  summary text not null,
  specs jsonb not null default '[]'::jsonb,
  sample_note text not null,
  constraint products_category_check check (
    category in ('console', 'display', 'headset', 'controller', 'storage', 'chair', 'desk')
  ),
  constraint products_bias_check check (bias in ('competitive', 'cinematic', 'neutral')),
  constraint products_quality_check check (quality between 1 and 100)
);

create table public.offers (
  id text primary key,
  product_slug text not null references public.products (slug) on delete cascade,
  retailer text not null,
  program text not null,
  price_cents integer not null,
  seed_price_cents integer not null,
  currency text not null default 'USD',
  url text not null,
  in_stock boolean not null default true,
  external_sku text not null,
  last_checked_at timestamptz not null,
  constraint offers_price_check check (price_cents > 0 and seed_price_cents > 0),
  constraint offers_program_check check (
    program in ('amazon', 'bestbuy', 'walmart', 'target', 'none')
  ),
  constraint offers_currency_check check (currency = 'USD')
);

create index offers_product_slug_idx on public.offers (product_slug);
create index offers_last_checked_idx on public.offers (last_checked_at);

create table public.price_history (
  id bigint generated always as identity primary key,
  offer_id text not null references public.offers (id) on delete cascade,
  price_cents integer not null,
  recorded_at timestamptz not null,
  constraint price_history_price_check check (price_cents > 0)
);

create index price_history_offer_recorded_idx on public.price_history (offer_id, recorded_at);

create table public.click_events (
  id bigint generated always as identity primary key,
  offer_id text not null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  destination_url text not null
);

create index click_events_offer_clicked_idx on public.click_events (offer_id, clicked_at desc);

alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.price_history enable row level security;
alter table public.click_events enable row level security;

-- Supabase grants broad table privileges by default. Take write access back
-- from the public roles. The secret key bypasses RLS and does not need these grants.
revoke all on public.products from anon, authenticated;
revoke all on public.offers from anon, authenticated;
revoke all on public.price_history from anon, authenticated;
revoke all on public.click_events from anon, authenticated;

grant select on public.products to anon, authenticated;
grant select on public.offers to anon, authenticated;
grant select on public.price_history to anon, authenticated;

create policy "Products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "Offers are publicly readable"
  on public.offers
  for select
  to anon, authenticated
  using (true);

create policy "Price history is publicly readable"
  on public.price_history
  for select
  to anon, authenticated
  using (true);
