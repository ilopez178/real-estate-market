import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { RateData, ForecastPoint, TimeRange, Grouping } from '../types';

interface Props {
  history: RateData[];
  forecast: ForecastPoint[];
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  showForecast: boolean;
  onToggleForecast: () => void;
  loading: boolean;
}

function groupData(data: RateData[], grouping: Grouping): RateData[] {
  if (grouping === 'daily' || grouping === 'weekly') return data;

  const buckets = new Map<string, { sum15: number; sum30: number; count: number }>();
  for (const d of data) {
    const key = grouping === 'monthly' ? d.date.slice(0, 7) : d.date.slice(0, 4);
    const b = buckets.get(key) ?? { sum15: 0, sum30: 0, count: 0 };
    if (d.rate15 !== null) { b.sum15 += d.rate15; b.count++; }
    if (d.rate30 !== null) b.sum30 += d.rate30;
    buckets.set(key, b);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      date: grouping === 'monthly' ? `${key}-01` : `${key}-01-01`,
      rate15: b.count ? +(b.sum15 / b.count).toFixed(2) : null,
      rate30: b.count ? +(b.sum30 / b.count).toFixed(2) : null,
    }));
}

function formatXAxis(date: string, grouping: Grouping): string {
  const d = new Date(date + 'T00:00:00');
  if (grouping === 'annually') return d.getFullYear().toString();
  if (grouping === 'monthly') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const RANGE_LABELS: Record<TimeRange, string> = { '2y': '2Y', '5y': '5Y', '10y': '10Y' };
const GROUPING_LABELS: Record<Grouping, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', annually: 'Annual' };

export default function RateChart({ history, forecast, range, onRangeChange, showForecast, onToggleForecast, loading }: Props) {
  const [grouping, setGrouping] = useState<Grouping>('weekly');

  const grouped = useMemo(() => groupData(history, grouping), [history, grouping]);

  const chartData = useMemo(() => {
    const base = grouped.map(d => ({
      date: d.date,
      rate15: d.rate15,
      rate30: d.rate30,
      forecast15: undefined as number | undefined,
      forecast30: undefined as number | undefined,
    }));
    if (!showForecast) return base;
    const forecastPoints = forecast.map(f => ({
      date: f.date,
      rate15: undefined as number | undefined,
      rate30: undefined as number | undefined,
      forecast15: f.rate15,
      forecast30: f.rate30,
    }));
    return [...base, ...forecastPoints];
  }, [grouped, forecast, showForecast]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-semibold text-white">Historical Rates</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded border border-[#333333] overflow-hidden">
            {(['2y', '5y', '10y'] as TimeRange[]).map(r => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${range === r ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#6b7280] hover:bg-[#222222]'}`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <div className="flex rounded border border-[#333333] overflow-hidden">
            {(['daily', 'weekly', 'monthly', 'annually'] as Grouping[]).map(g => (
              <button
                key={g}
                onClick={() => setGrouping(g)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${grouping === g ? 'bg-[#0ea5e9] text-white' : 'bg-[#1a1a1a] text-[#6b7280] hover:bg-[#222222]'}`}
              >
                {GROUPING_LABELS[g]}
              </button>
            ))}
          </div>
          <button
            onClick={onToggleForecast}
            className={`px-3 py-1 text-sm font-medium rounded border transition-colors ${showForecast ? 'bg-[#f97316] text-white border-[#f97316]' : 'bg-[#1a1a1a] text-[#6b7280] border-[#333333] hover:bg-[#222222]'}`}
          >
            {showForecast ? 'Hide Forecast' : 'Show Forecast'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center text-[#6b7280]">Loading rate history…</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tickFormatter={d => formatXAxis(d as string, grouping)}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={v => `${v}%`}
              width={44}
            />
            <Tooltip
              formatter={(v: unknown, name: string) => [`${v}%`, name]}
              labelFormatter={l => new Date(l as string + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 8, fontSize: 13, color: '#c8c8c8' }}
            />
            <Legend wrapperStyle={{ fontSize: 13, color: '#c8c8c8' }} />
            {showForecast && <ReferenceLine x={todayStr} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Today', position: 'top', fontSize: 11, fill: '#6b7280' }} />}
            <Line type="monotone" dataKey="rate15" name="15-Year" stroke="#10b981" dot={false} strokeWidth={2} connectNulls />
            <Line type="monotone" dataKey="rate30" name="30-Year" stroke="#0ea5e9" dot={false} strokeWidth={2} connectNulls />
            {showForecast && (
              <>
                <Line type="monotone" dataKey="forecast15" name="15-Year Forecast" stroke="#10b981" dot={false} strokeWidth={2} strokeDasharray="5 4" connectNulls />
                <Line type="monotone" dataKey="forecast30" name="30-Year Forecast" stroke="#0ea5e9" dot={false} strokeWidth={2} strokeDasharray="5 4" connectNulls />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
