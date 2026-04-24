import type { RateData, ForecastResult, ForecastPoint } from '../types';

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0 };
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function movingAverage(values: number[], window: number): number {
  const slice = values.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function trendStrength(slope: number, values: number[]): number {
  if (!values.length) return 0;
  const range = Math.max(...values) - Math.min(...values);
  if (range === 0) return 0;
  return Math.min(1, Math.abs(slope * 7) / (range * 0.1));
}

function classifyTrend(change: number): 'increasing' | 'decreasing' | 'stable' {
  if (change > 0.05) return 'increasing';
  if (change < -0.05) return 'decreasing';
  return 'stable';
}

function classifyConfidence(strength: number, dataPoints: number): 'high' | 'moderate' | 'low' {
  if (dataPoints < 10) return 'low';
  if (strength > 0.6 && dataPoints >= 30) return 'high';
  if (strength > 0.3) return 'moderate';
  return 'low';
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function generateForecast(history: RateData[]): ForecastResult {
  const LOOKBACK = 90;
  const HORIZON = 30;

  const valid = history
    .filter(d => d.rate15 !== null && d.rate30 !== null)
    .slice(-LOOKBACK);

  if (valid.length < 4) {
    const last = valid[valid.length - 1] ?? { rate15: 7, rate30: 7.5, date: new Date().toISOString().split('T')[0] };
    const today = last.date;
    const points: ForecastPoint[] = Array.from({ length: HORIZON }, (_, i) => ({
      date: addDays(today, i + 1),
      rate15: last.rate15!,
      rate30: last.rate30!,
    }));
    return {
      points,
      trend15: 'stable',
      trend30: 'stable',
      confidence: 'low',
      change15: 0,
      change30: 0,
    };
  }

  const xs = valid.map((_, i) => i);
  const y15 = valid.map(d => d.rate15!);
  const y30 = valid.map(d => d.rate30!);

  const reg15 = linearRegression(xs, y15);
  const reg30 = linearRegression(xs, y30);

  const strength15 = trendStrength(reg15.slope, y15);
  const strength30 = trendStrength(reg30.slope, y30);
  const ma15 = movingAverage(y15, 14);
  const ma30 = movingAverage(y30, 14);

  const lastDate = valid[valid.length - 1].date;
  const baseIdx = valid.length;

  const points: ForecastPoint[] = Array.from({ length: HORIZON }, (_, i) => {
    const futureIdx = baseIdx + i;
    const linear15 = reg15.slope * futureIdx + reg15.intercept;
    const linear30 = reg30.slope * futureIdx + reg30.intercept;
    return {
      date: addDays(lastDate, i + 1),
      rate15: +(strength15 * linear15 + (1 - strength15) * ma15).toFixed(2),
      rate30: +(strength30 * linear30 + (1 - strength30) * ma30).toFixed(2),
    };
  });

  const last15 = y15[y15.length - 1];
  const last30 = y30[y30.length - 1];
  const change15 = +(points[HORIZON - 1].rate15 - last15).toFixed(2);
  const change30 = +(points[HORIZON - 1].rate30 - last30).toFixed(2);

  return {
    points,
    trend15: classifyTrend(change15),
    trend30: classifyTrend(change30),
    confidence: classifyConfidence(Math.max(strength15, strength30), valid.length),
    change15,
    change30,
  };
}

export function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
