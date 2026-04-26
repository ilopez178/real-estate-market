import { writeFileSync, mkdirSync } from 'fs';

const API_KEY = process.env.VITE_FRED_API_KEY;
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchSeries(seriesId, params = {}) {
  const q = new URLSearchParams({
    series_id: seriesId,
    api_key: API_KEY,
    file_type: 'json',
    sort_order: 'desc',
    ...params,
  });
  const res = await fetch(`${FRED_BASE}?${q}`);
  if (!res.ok) throw new Error(`FRED ${seriesId}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.error_message) throw new Error(`FRED ${seriesId}: ${data.error_message}`);
  return data.observations.filter(o => o.value !== '.' && o.value !== 'ND');
}

async function main() {
  if (!API_KEY) throw new Error('VITE_FRED_API_KEY secret is not set');

  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const start = tenYearsAgo.toISOString().split('T')[0];

  console.log('Fetching national mortgage rate data from FRED...');
  const [cur15, cur30, hist15, hist30] = await Promise.all([
    fetchSeries('MORTGAGE15US', { limit: '1' }),
    fetchSeries('MORTGAGE30US', { limit: '1' }),
    fetchSeries('MORTGAGE15US', { observation_start: start, sort_order: 'asc' }),
    fetchSeries('MORTGAGE30US', { observation_start: start, sort_order: 'asc' }),
  ]);

  const national = {
    fetchedAt: new Date().toISOString(),
    current: {
      rate15: parseFloat(cur15[0].value),
      date15: cur15[0].date,
      rate30: parseFloat(cur30[0].value),
      date30: cur30[0].date,
    },
    history15: hist15.map(o => ({ date: o.date, value: parseFloat(o.value) })),
    history30: hist30.map(o => ({ date: o.date, value: parseFloat(o.value) })),
  };

  mkdirSync('public/data', { recursive: true });
  writeFileSync('public/data/national.json', JSON.stringify(national));
  console.log(`Done: 30Y=${cur30[0].value}%  15Y=${cur15[0].value}%  (${cur30[0].date})`);
}

main().catch(err => {
  console.error('fetch-fred-data failed:', err.message);
  process.exit(1);
});
