# CLAUDE.md — real-estate-market

## What This Is

A React + TypeScript mortgage rate dashboard hosted as a GitHub Pages sub-path at `irvinglopez.com/real-estate-market`. It fetches live data from the FRED API (Federal Reserve Bank of St. Louis), shows national mortgage rates, state-level market metrics, algorithmic forecasts, and a market condition score.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 (dark theme) |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Backend/Proxy | Supabase Edge Functions (Deno) |
| Notifications | Web Push API + Supabase |
| Deployment | GitHub Actions → GitHub Pages |

## Hosting & Domain

- Deployed at: `irvinglopez.com/real-estate-market` (sub-path of the main portfolio site)
- `vite.config.ts` sets `base: '/real-estate-market/'` — **do not change this**
- The main portfolio site (`irvinglopez.com`) lives in a separate repo: `ilopez178/ilopez178.github.io`
- GitHub Actions workflow: `.github/workflows/deploy.yml` — triggers on `main` branch push

## Design System

Matches `irvinglopez.com` dark theme. **Always use these values, never hardcode alternatives.**

| Token | Value | Usage |
|---|---|---|
| Page background | `#080808` | `bg-[#080808]` |
| Card surface | `#111111` | `bg-[#111111]` |
| Secondary surface | `#1a1a1a` | `bg-[#1a1a1a]` |
| Sub-element | `#1e1e1e` | `bg-[#1e1e1e]` |
| Border subtle | `#2a2a2a` | `border-[#2a2a2a]` |
| Border medium | `#333333` | `border-[#333333]` |
| Text primary | `#ffffff` | `text-white` |
| Text body | `#c8c8c8` | `text-[#c8c8c8]` |
| Text muted | `#6b7280` | `text-[#6b7280]` |
| Text faint | `#4b5563` | `text-[#4b5563]` |
| Accent (sky blue) | `#0ea5e9` | `text-[#0ea5e9]` / `bg-[#0ea5e9]` |
| Green | `#10b981` | `text-[#10b981]` |
| Red | `#ef4444` / `text-red-400` | errors, rate increases |
| Orange | `#f97316` | forecast toggle |

**Font**: Inter (loaded from Google Fonts in `src/index.css`). The `tailwind.config.ts` sets `Inter` as `font-sans`.

**Chart colors**: CartesianGrid `#2a2a2a`, axis ticks `#6b7280`, tooltip bg `#1a1a1a` / border `#333333`.

## Architecture

```
src/
  App.tsx                    # Root: state management + layout
  index.css                  # Global dark theme + Inter font import
  main.tsx                   # React entry point
  components/
    RateCard.tsx             # Current 15/30-year rate display cards
    RateChart.tsx            # Historical + forecast line chart (Recharts)
    StateMarketData.tsx      # HPI, existing sales, permits, days-on-market grid
    ForecastInsights.tsx     # 30-day forecast + payment impact panel
    MarketConditionChart.tsx # Area chart: buyer/seller market score
    MarketPatternInsights.tsx# Text insights derived from rate history + state data
    StateSelector.tsx        # Searchable state dropdown + geolocation
    NotificationToggle.tsx   # Web Push subscribe/unsubscribe
    LoadingSpinner.tsx       # Shared loading indicator
  utils/
    fredApi.ts               # All FRED API calls — routes through Supabase proxy
    forecasting.ts           # Algorithmic 30-day rate forecast
    marketCondition.ts       # Composite buyer/seller score computation
    pushNotifications.ts     # Web Push subscription helpers
    stateData.ts             # STATES array: 51 entries with FRED series IDs
  types/
    index.ts                 # All shared TypeScript types

supabase/
  functions/
    fred-proxy/
      index.ts               # Deno Edge Function: CORS-safe FRED API proxy
  migrations/                # Database migrations (if any)
```

## API Architecture — Critical

**The FRED API cannot be called directly from the browser in production** (CORS headers are only returned for valid API keys; an empty/missing key causes `TypeError: Failed to fetch`).

**Flow**: Browser → Supabase Edge Function (`fred-proxy`) → FRED API

- `fredApi.ts` detects `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` at build time
- If both are present → routes all FRED calls through `<SUPABASE_URL>/functions/v1/fred-proxy`
- If not present (local dev without Supabase) → falls back to direct FRED calls using `VITE_FRED_API_KEY`
- The proxy adds the `FRED_API_KEY` server-side (Supabase secret) and returns CORS headers

## Environment Variables

### Build-time (GitHub Secrets → Vite)
```
VITE_SUPABASE_URL        Supabase project URL (required for API proxy to work)
VITE_SUPABASE_ANON_KEY   Supabase anon key (required for API proxy to work)
VITE_VAPID_PUBLIC_KEY    Web Push VAPID public key
VITE_FRED_API_KEY        FRED API key (only needed for local dev without Supabase)
```

### Supabase Secrets (server-side only, never in browser)
```
FRED_API_KEY             FRED API key — set via: supabase secrets set FRED_API_KEY=xxx
```

### Local dev `.env` (gitignored)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_FRED_API_KEY=your_fred_key   # fallback if no Supabase
```

## FRED Series IDs

State data uses these FRED series patterns:
- Home Price Index: `{ST}STHPI` (e.g., `TXSTHPI`)
- Building Permits: `{ST}BPPRIVSA` (e.g., `TXBPPRIVSA`)
- Days on Market: `MEDDAYONMAR{ST}` (e.g., `MEDDAYONMARTX`)
- National rates: `MORTGAGE15US`, `MORTGAGE30US`

**Known past bugs (fixed):**
- Colorado `daysOnMarket` had a Cyrillic `О` instead of Latin `O` — now fixed to `MEDDAYONMARCO`
- Kentucky had the same series ID as Kansas — now fixed to `MEDDAYONMARKY`

## Deployment

### First-time Supabase setup (required for production API to work)
```bash
# 1. Deploy the Edge Function
supabase functions deploy fred-proxy

# 2. Set the FRED API key as a Supabase secret (never goes to browser)
supabase secrets set FRED_API_KEY=your_actual_fred_api_key

# 3. Set GitHub Secrets in repo settings:
#    VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_VAPID_PUBLIC_KEY
```

### Push to deploy
```bash
git push origin main   # triggers deploy.yml → GitHub Pages
```

## Local Development

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:5173/real-estate-market/
```

## Key Implementation Notes

- `vite.config.ts` uses `base: '/real-estate-market/'` for sub-path hosting — always required
- `generateForecast()` in `forecasting.ts` uses exponential smoothing + linear regression
- `computeMarketConditionScores()` in `marketCondition.ts` normalizes HPI growth, permits, DOM, and rate trends into a −1 to +1 composite score
- The default state is Texas (`TX`) — set via `DEFAULT_STATE` in `App.tsx`
- `StateSelector` uses geolocation via `bigdatacloud.net` reverse geocode (no API key needed)
- Web Push uses VAPID keys; the Supabase function handles subscription storage
