-- Mortgage rate cache (5-minute TTL, keyed by FRED series + date range)
create table if not exists mortgage_rate_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  cached_at   timestamptz not null default now()
);

alter table mortgage_rate_cache enable row level security;

create policy "Public read cache"
  on mortgage_rate_cache for select using (true);

create policy "Service role write cache"
  on mortgage_rate_cache for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Push subscriptions
create table if not exists push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  subscription  jsonb not null,
  created_at    timestamptz not null default now(),
  constraint valid_endpoint   check ((subscription->>'endpoint') is not null),
  constraint valid_p256dh     check ((subscription->'keys'->>'p256dh') is not null),
  constraint valid_auth       check ((subscription->'keys'->>'auth') is not null),
  constraint https_endpoint   check ((subscription->>'endpoint') like 'https://%')
);

alter table push_subscriptions enable row level security;

create policy "Validated insert push subscriptions"
  on push_subscriptions for insert with check (true);

create policy "Delete own push subscription"
  on push_subscriptions for delete
  using (true);

create policy "Service role select push subscriptions"
  on push_subscriptions for select
  using (auth.role() = 'service_role');

-- Rate forecasts (persisted predictions)
create table if not exists rate_forecasts (
  id            uuid primary key default gen_random_uuid(),
  generated_at  timestamptz not null default now(),
  series_15     jsonb not null,
  series_30     jsonb not null,
  metadata      jsonb
);

alter table rate_forecasts enable row level security;

create policy "Public read forecasts"
  on rate_forecasts for select using (true);

create policy "Service role write forecasts"
  on rate_forecasts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
