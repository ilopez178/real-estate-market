# Mortgage Rates Tracker

Live mortgage rate dashboard at **[irvinglopez.com/real-estate-market](https://irvinglopez.com/real-estate-market/)** — part of the [irvinglopez.com](https://irvinglopez.com) portfolio.

Tracks 30-year and 15-year fixed mortgage rates, state-level housing market metrics, buyer/seller market scores, and 30-day forecasts. All data sourced from the Federal Reserve's [FRED database](https://fred.stlouisfed.org/).

---

## Features

- **Live mortgage rates** — 30-year and 15-year fixed, updated weekly from FRED
- **Rate history charts** — 2y / 5y / 10y views with optional 30-day forecast overlay
- **State market data** — Home price index, building permits, days on market, existing sales for all 50 states + DC
- **Market condition score** — Composite −1 (buyer's) to +1 (seller's) score based on HPI growth, permits, DOM, and rate trends
- **Market pattern insights** — Plain-English analysis of rate direction, spread, and local market conditions
- **Geolocation** — Auto-detect your state via browser location
- **Push notifications** — Subscribe to rate change alerts (VAPID/Web Push via Supabase)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 (dark theme) |
| Charts | Recharts 2 |
| Icons | Lucide React |
| API Proxy | Supabase Edge Functions (Deno) |
| Notifications | Web Push API + Supabase |
| Deployment | GitHub Actions → GitHub Pages |

---

## How the Data Works

The FRED API cannot be called directly from the browser in production — CORS headers are only returned when a valid API key is present. This app uses two strategies to work around it:

**National rates** (30-year, 15-year) are fetched **at build time** by `scripts/fetch-fred-data.mjs` during the GitHub Actions workflow. The result is written to `public/data/national.json` and bundled as a static file. No CORS issues.

**State-level data** (HPI, permits, days on market, existing sales) is fetched **at runtime** through a Supabase Edge Function (`supabase/functions/fred-proxy/index.ts`). The function runs on Deno, injects the `FRED_API_KEY` server-side, and returns CORS headers so the browser can call it freely.

```
Browser → Supabase Edge Function → FRED API
```

---

## Project Structure

```
├── public/
│   ├── data/national.json        # Generated at build time — do not edit
│   ├── favicon.svg               # Dark-themed house icon
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   └── fetch-fred-data.mjs       # Build-time FRED national rate fetcher
├── src/
│   ├── App.tsx                   # Root layout + state management
│   ├── index.css                 # Global dark theme + Inter font
│   ├── components/
│   │   ├── RateCard.tsx          # Current 15/30-year rate display
│   │   ├── RateChart.tsx         # Historical + forecast line chart
│   │   ├── StateMarketData.tsx   # HPI, sales, permits, DOM grid
│   │   ├── ForecastInsights.tsx  # 30-day forecast + payment impact
│   │   ├── MarketConditionChart.tsx  # Buyer/seller score area chart
│   │   ├── MarketPatternInsights.tsx # Text market analysis
│   │   ├── StateSelector.tsx     # Searchable state dropdown + geolocation
│   │   ├── NotificationToggle.tsx
│   │   └── LoadingSpinner.tsx
│   ├── utils/
│   │   ├── fredApi.ts            # All FRED data fetching
│   │   ├── forecasting.ts        # Exponential smoothing + regression
│   │   ├── marketCondition.ts    # Composite score computation
│   │   ├── pushNotifications.ts  # Web Push subscription helpers
│   │   └── stateData.ts          # 51 states with FRED series IDs
│   └── types/index.ts            # Shared TypeScript types
├── supabase/
│   ├── config.toml               # Links to project zukyaiizgibjvcggxupw
│   └── functions/
│       └── fred-proxy/index.ts   # Deno Edge Function — CORS proxy
└── .github/workflows/deploy.yml  # CI/CD: build + deploy to GitHub Pages
```

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/ilopez178/real-estate-market.git
cd real-estate-market
npm install

# 2. Create .env
cp .env.example .env
# Fill in your values (see Environment Variables below)

# 3. Start dev server
npm run dev
# → http://localhost:5173/real-estate-market/
```

---

## Environment Variables

### Build-time (GitHub Secrets → Vite)

| Variable | Purpose |
|---|---|
| `VITE_FRED_API_KEY` | FRED API key — used by `scripts/fetch-fred-data.mjs` at build time |
| `VITE_SUPABASE_URL` | Supabase project URL — baked into the browser bundle for state data proxy |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key — baked into the browser bundle |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notification subscriptions |

### Supabase Secrets (server-side only — never exposed to browser)

| Variable | Purpose |
|---|---|
| `FRED_API_KEY` | FRED API key injected by the Edge Function when proxying requests |

Set it with: `supabase secrets set FRED_API_KEY=your_key`

---

## Deployment

### One-time Supabase setup

```bash
supabase login
supabase link --project-ref zukyaiizgibjvcggxupw
supabase functions deploy fred-proxy
supabase secrets set FRED_API_KEY=your_fred_api_key
```

### GitHub Secrets to set (repo Settings → Secrets → Actions)

```
VITE_SUPABASE_URL      = https://zukyaiizgibjvcggxupw.supabase.co
VITE_SUPABASE_ANON_KEY = <anon key from Supabase dashboard → Settings → API>
VITE_FRED_API_KEY      = <your FRED API key>
VITE_VAPID_PUBLIC_KEY  = <your VAPID public key>
```

### Deploy

```bash
git push origin main   # triggers deploy.yml → GitHub Pages
```

---

## FRED Series IDs

| Data | Pattern | Example |
|---|---|---|
| Home Price Index | `{ST}STHPI` | `TXSTHPI` |
| Building Permits | `{ST}BPPRIVSA` | `TXBPPRIVSA` |
| Days on Market | `MEDDAYONMAR{ST}` | `MEDDAYONMARTX` |
| 30-year rate | `MORTGAGE30US` | — |
| 15-year rate | `MORTGAGE15US` | — |

---

## Design System

Matches the [irvinglopez.com](https://irvinglopez.com) dark theme. Always use these tokens:

| Token | Value |
|---|---|
| Page background | `#080808` |
| Card surface | `#111111` |
| Secondary surface | `#1a1a1a` |
| Border subtle | `#2a2a2a` |
| Border medium | `#333333` |
| Text body | `#c8c8c8` |
| Text muted | `#6b7280` |
| Accent blue | `#0ea5e9` |
| Green | `#10b981` |

Font: **Inter** (Google Fonts). Charts: CartesianGrid `#2a2a2a`, tooltip bg `#1a1a1a`.

---

## Known Past Bugs (Fixed)

- **Colorado typo** — `daysOnMarket` series ID had a Cyrillic `О` (U+041E) instead of Latin `O`, silently returning no data. Fixed to `MEDDAYONMARCO`.
- **Kentucky duplicate** — `daysOnMarket` series ID was `MEDDAYONMARKS` (same as Kansas). Fixed to `MEDDAYONMARKY`.
- **Unused `parseRate` function** — Left over after the national data refactor, broke CI due to `noUnusedLocals: true` in tsconfig.
