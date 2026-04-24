import type { FredObservation, MarketConditionPoint } from '../types';

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

function toMonthKey(date: string): string {
  return date.slice(0, 7); // YYYY-MM
}

function buildMonthlyMap(obs: FredObservation[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const o of obs) {
    const v = parseFloat(o.value);
    if (!isNaN(v)) map.set(toMonthKey(o.date), v);
  }
  return map;
}

export function computeMarketConditionScores(
  hpiHistory: FredObservation[],
  permitsHistory: FredObservation[],
  domHistory: FredObservation[],
  rate30History: FredObservation[]
): MarketConditionPoint[] {
  const hpiMap     = buildMonthlyMap(hpiHistory);
  const permMap    = buildMonthlyMap(permitsHistory);
  const domMap     = buildMonthlyMap(domHistory);
  const rate30Map  = buildMonthlyMap(rate30History);

  // Collect all months from any source
  const allMonths = new Set([
    ...hpiMap.keys(),
    ...permMap.keys(),
    ...domMap.keys(),
    ...rate30Map.keys(),
  ]);

  const sorted = Array.from(allMonths).sort();

  // Compute month-over-month HPI change (price trend: rising = seller's market)
  const hpiArr = sorted.map(m => hpiMap.get(m) ?? null);
  const hpiChange = hpiArr.map((v, i) => {
    if (i === 0 || v === null || hpiArr[i - 1] === null) return null;
    return v - hpiArr[i - 1]!;
  });

  // Gather all non-null values per signal for normalization
  const domVals      = sorted.map(m => domMap.get(m) ?? null).filter(v => v !== null) as number[];
  const hpiChgVals   = hpiChange.filter(v => v !== null) as number[];
  const permVals     = sorted.map(m => permMap.get(m) ?? null).filter(v => v !== null) as number[];
  const rate30Vals   = sorted.map(m => rate30Map.get(m) ?? null).filter(v => v !== null) as number[];

  const domMin   = Math.min(...domVals),   domMax   = Math.max(...domVals);
  const hpiMin   = Math.min(...hpiChgVals),hpiMax   = Math.max(...hpiChgVals);
  const permMin  = Math.min(...permVals),  permMax  = Math.max(...permVals);
  const rate30Min= Math.min(...rate30Vals),rate30Max= Math.max(...rate30Vals);

  const points: MarketConditionPoint[] = [];

  sorted.forEach((month, i) => {
    const signals: { value: number; weight: number }[] = [];

    // HPI change: higher = seller's (positive score)
    const hpiChg = hpiChange[i];
    if (hpiChg !== null && hpiChgVals.length > 1) {
      const norm = normalize(hpiChg, hpiMin, hpiMax) * 2 - 1; // [-1, 1]
      signals.push({ value: norm, weight: 0.35 });
    }

    // Days on market: lower = seller's (positive score) → invert
    const dom = domMap.get(month) ?? null;
    if (dom !== null && domVals.length > 1) {
      const norm = -(normalize(dom, domMin, domMax) * 2 - 1); // invert
      signals.push({ value: norm, weight: 0.30 });
    }

    // Building permits: higher supply = buyer's market (negative score)
    const perm = permMap.get(month) ?? null;
    if (perm !== null && permVals.length > 1) {
      const norm = -(normalize(perm, permMin, permMax) * 2 - 1); // invert
      signals.push({ value: norm, weight: 0.20 });
    }

    // Rate: higher rates cool demand = buyer's market (negative score)
    const rate = rate30Map.get(month) ?? null;
    if (rate !== null && rate30Vals.length > 1) {
      const norm = -(normalize(rate, rate30Min, rate30Max) * 2 - 1); // invert
      signals.push({ value: norm, weight: 0.15 });
    }

    if (!signals.length) return;

    const totalWeight = signals.reduce((a, s) => a + s.weight, 0);
    const score = signals.reduce((a, s) => a + s.value * s.weight, 0) / totalWeight;
    const clamped = Math.max(-1, Math.min(1, score));

    points.push({
      date: `${month}-01`,
      score: +clamped.toFixed(3),
      label: clamped > 0.2 ? "Seller's" : clamped < -0.2 ? "Buyer's" : 'Neutral',
    });
  });

  return points;
}
