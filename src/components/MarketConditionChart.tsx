import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import type { MarketConditionPoint } from '../types';

interface Props {
  data: MarketConditionPoint[];
  stateName: string;
  loading: boolean;
}

function formatMonth(date: string): string {
  const [y, m] = date.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function scoreColor(score: number): string {
  if (score > 0.2) return '#00A87E';
  if (score < -0.2) return '#0073B9';
  return '#9ca3af';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: MarketConditionPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const condition = score > 0.2 ? "Seller's Market" : score < -0.2 ? "Buyer's Market" : 'Neutral Market';
  const color = scoreColor(score);
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
      <div className="font-medium text-gray-700 mb-1">{label ? formatMonth(label) : ''}</div>
      <div style={{ color }} className="font-semibold">{condition}</div>
      <div className="text-gray-500 text-xs mt-0.5">Score: {score.toFixed(2)}</div>
    </div>
  );
}

export default function MarketConditionChart({ data, stateName, loading }: Props) {
  const latest = data[data.length - 1];

  const gradientId = 'marketGradient';

  const ticks = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 8));
    return data.filter((_, i) => i % step === 0).map(d => d.date);
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-800">Market Condition — {stateName}</h2>
        {latest && (
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full border"
            style={{ color: scoreColor(latest.score), borderColor: scoreColor(latest.score), background: `${scoreColor(latest.score)}15` }}
          >
            {latest.label}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">Composite score: −1 = strong buyer's market · +1 = strong seller's market</p>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading market condition data…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Not enough data for this state.</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00A87E" stopOpacity={0.25} />
                <stop offset="50%" stopColor="#e5e7eb" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0073B9" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatMonth}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={v => v.toFixed(1)}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              payload={[
                { value: "Seller's Market (+1)", type: 'line', color: '#00A87E' },
                { value: "Buyer's Market (−1)",  type: 'line', color: '#0073B9' },
              ]}
              wrapperStyle={{ fontSize: 12 }}
            />
            <ReferenceLine y={0.2}   stroke="#00A87E" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Seller's", position: 'right', fontSize: 10, fill: '#00A87E' }} />
            <ReferenceLine y={0}     stroke="#9ca3af" strokeDasharray="2 2" strokeWidth={1} />
            <ReferenceLine y={-0.2}  stroke="#0073B9" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Buyer's", position: 'right', fontSize: 10, fill: '#0073B9' }} />
            <Area
              type="monotone"
              dataKey="score"
              name="Market Score"
              stroke="#6b7280"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
