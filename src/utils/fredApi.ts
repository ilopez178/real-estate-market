import type { FredObservation, RateData, CurrentRates, StateMarketData } from '../types';
import type { StateInfo } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const FRED_DIRECT = 'https://api.stlouisfed.org/fred/series/observations';

function getBase(): string {
  return SUPABASE_URL && SUPABASE_ANON_KEY
    ? `${SUPABASE_URL}/functions/v1/fred-proxy`
    : FRED_DIRECT;
}

function fredUrl(seriesId: string, params: Record<string, string> = {}): string {
  const q = new URLSearchParams({
    series_id: seriesId,
    file_type: 'json',
    sort_order: 'desc',
    ...params,
  });

  const base = getBase();
  if (base === FRED_DIRECT) {
    const key = import.meta.env.VITE_FRED_API_KEY as string | undefined;
    if (key) q.set('api_key', key);
  }

  return `${base}?${q}`;
}

async function fetchSeries(seriesId: string, params: Record<string, string> = {}): Promise<FredObservation[]> {
  const headers: HeadersInit = {};
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    headers['apikey'] = SUPABASE_ANON_KEY;
  }
  const res = await fetch(fredUrl(seriesId, params), { headers });
  if (!res.ok) throw new Error(`FRED ${seriesId}: ${res.status}`);
  const data = await res.json() as { observations: FredObservation[] };
  return data.observations.filter(o => o.value !== '.' && o.value !== 'ND');
}

function parseRate(obs: FredObservation[]): number | null {
  if (!obs.length) return null;
  const val = parseFloat(obs[0].value);
  return isNaN(val) ? null : val;
}

export async function fetchCurrentRates(): Promise<CurrentRates> {
  const [obs15, obs30] = await Promise.all([
    fetchSeries('MORTGAGE15US', { limit: '1' }),
    fetchSeries('MORTGAGE30US', { limit: '1' }),
  ]);

  const rate15 = parseRate(obs15);
  const rate30 = parseRate(obs30);

  if (rate15 === null || rate30 === null) {
    throw new Error('Could not fetch current mortgage rates');
  }

  return {
    rate15,
    rate30,
    date15: obs15[0]?.date ?? '',
    date30: obs30[0]?.date ?? '',
  };
}

function startDateForRange(range: '2y' | '5y' | '10y'): string {
  const d = new Date();
  const years = range === '2y' ? 2 : range === '5y' ? 5 : 10;
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

export async function fetchRateHistory(range: '2y' | '5y' | '10y'): Promise<RateData[]> {
  const start = startDateForRange(range);
  const [obs15, obs30] = await Promise.all([
    fetchSeries('MORTGAGE15US', { observation_start: start, sort_order: 'asc' }),
    fetchSeries('MORTGAGE30US', { observation_start: start, sort_order: 'asc' }),
  ]);

  const map30 = new Map(obs30.map(o => [o.date, parseFloat(o.value)]));
  const map15 = new Map(obs15.map(o => [o.date, parseFloat(o.value)]));

  const allDates = new Set([...map15.keys(), ...map30.keys()]);
  return Array.from(allDates)
    .sort()
    .map(date => ({
      date,
      rate15: map15.has(date) ? map15.get(date)! : null,
      rate30: map30.has(date) ? map30.get(date)! : null,
    }));
}

function latestObservation(obs: FredObservation[]): { value: number | null; date: string | null } {
  if (!obs.length) return { value: null, date: null };
  const val = parseFloat(obs[0].value);
  return { value: isNaN(val) ? null : val, date: obs[0].date };
}

export async function fetchStateMarketData(state: StateInfo): Promise<StateMarketData> {
  const { fredCodes } = state;

  const fetches: Promise<FredObservation[]>[] = [
    fetchSeries(fredCodes.sthpi,        { limit: '1' }).catch(() => []),
    fetchSeries(fredCodes.permits,      { limit: '1' }).catch(() => []),
    fetchSeries(fredCodes.daysOnMarket, { limit: '1' }).catch(() => []),
  ];

  if (fredCodes.existingSales) {
    fetches.push(fetchSeries(fredCodes.existingSales, { limit: '1' }).catch(() => []));
  }

  const [sthpiObs, permitsObs, domObs, salesObs] = await Promise.all(fetches);

  const hpi     = latestObservation(sthpiObs ?? []);
  const permits = latestObservation(permitsObs ?? []);
  const dom     = latestObservation(domObs ?? []);
  const sales   = latestObservation(salesObs ?? []);

  return {
    homePrice: hpi.value,
    homePriceDate: hpi.date,
    buildingPermits: permits.value,
    buildingPermitsDate: permits.date,
    daysOnMarket: dom.value,
    daysOnMarketDate: dom.date,
    existingSales: sales.value,
    existingSalesDate: sales.date,
  };
}

export async function fetchMarketConditionHistory(state: StateInfo): Promise<{
  hpiHistory: FredObservation[];
  permitsHistory: FredObservation[];
  domHistory: FredObservation[];
  rate30History: FredObservation[];
}> {
  const start = startDateForRange('5y');
  const { fredCodes } = state;

  const [hpiHistory, permitsHistory, domHistory, rate30History] = await Promise.all([
    fetchSeries(fredCodes.sthpi,        { observation_start: start, sort_order: 'asc' }).catch(() => []),
    fetchSeries(fredCodes.permits,      { observation_start: start, sort_order: 'asc' }).catch(() => []),
    fetchSeries(fredCodes.daysOnMarket, { observation_start: start, sort_order: 'asc' }).catch(() => []),
    fetchSeries('MORTGAGE30US',         { observation_start: start, sort_order: 'asc' }).catch(() => []),
  ]);

  return { hpiHistory, permitsHistory, domHistory, rate30History };
}

export async function detectStateFromGeolocation(): Promise<string | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json() as { principalSubdivisionCode?: string };
          const code = data.principalSubdivisionCode?.replace('US-', '') ?? null;
          resolve(code);
        } catch { resolve(null); }
      },
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
