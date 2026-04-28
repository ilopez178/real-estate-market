import { useMemo, useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
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
  if (score > 0.2) return '#10b981';
  if (score < -0.2) return '#0ea5e9';
  return '#6b7280';
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
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-md p-3 text-sm">
      <div className="font-medium text-[#c8c8c8] mb-1">{label ? formatMonth(label) : ''}</div>
      <div style={{ color }} className="font-semibold">{condition}</div>
      <div className="text-[#6b7280] text-xs mt-0.5">Score: {score.toFixed(2)}</div>
    </div>
  );
}

function InfoContent() {
  return (
    <>
      <div className="space-y-3">
        <div>
          <span className="font-semibold text-[#10b981]">Seller's Market (+1)</span>
          <p className="text-[#6b7280] mt-0.5 text-xs">Low inventory, homes sell fast, prices rising. Sellers hold more negotiating power.</p>
        </div>
        <div>
          <span className="font-semibold text-[#0ea5e9]">Buyer's Market (−1)</span>
          <p className="text-[#6b7280] mt-0.5 text-xs">More homes than buyers, longer days on market, prices soften. Buyers can negotiate.</p>
        </div>
        <div>
          <span className="font-semibold text-[#6b7280]">Neutral (0)</span>
          <p className="text-[#6b7280] mt-0.5 text-xs">Supply and demand roughly balanced. Typical conditions for both sides.</p>
        </div>
      </div>
      <p className="mt-3 pt-3 border-t border-[#2a2a2a] text-[#4b5563] text-xs">Score combines HPI growth, building permits, days on market, and rate trends.</p>
    </>
  );
}

export default function MarketConditionChart({ data, stateName, loading }: Props) {
  const latest = data[data.length - 1];
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  const gradientId = 'marketGradient';

  useEffect(() => {
    if (!showInfo) return;
    function close(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false);
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showInfo]);

  const ticks = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 8));
    return data.filter((_, i) => i % step === 0).map(d => d.date);
  }, [data]);

  return (
    <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Market Condition — {stateName}</h2>
          <div ref={infoRef} className="relative">
            <button
              onClick={() => setShowInfo(s => !s)}
              className={`transition-colors flex items-center ${showInfo ? 'text-[#0ea5e9]' : 'text-[#4b5563] hover:text-[#6b7280]'}`}
              aria-label="Market condition explained"
            >
              <Info className="w-4 h-4" />
            </button>

            {showInfo && (
              <>
                {/* Mobile: full-screen centered modal */}
                <div
                  className="sm:hidden fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-6"
                  onClick={() => setShowInfo(false)}
                >
                  <div
                    className="bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl p-5 w-full max-w-sm"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-white">Market Conditions</span>
                      <button onClick={() => setShowInfo(false)} className="text-[#4b5563] hover:text-[#c8c8c8]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <InfoContent />
                  </div>
                </div>

                {/* Desktop: absolute dropdown */}
                <div className="hidden sm:block absolute left-0 top-7 z-20 w-72 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl p-3 text-xs">
                  <InfoContent />
                </div>
              </>
            )}
          </div>
        </div>
        {latest && (
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full border"
            style={{ color: scoreColor(latest.score), borderColor: scoreColor(latest.score), background: `${scoreColor(latest.score)}18` }}
          >
            {latest.label}
          </span>
        )}
      </div>
      <p className="text-xs text-[#6b7280] mb-5">Composite score: −1 = strong buyer's market · +1 = strong seller's market</p>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-[#6b7280] text-sm">Loading market condition data…</div>
      ) : data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-[#6b7280] text-sm">Not enough data for this state.</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#2a2a2a" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatMonth}
              tick={{ fontSize: 11, fill: '#6b7280' }}
            />
            <YAxis
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={v => v.toFixed(1)}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              payload={[
                { value: "Seller's Market (+1)", type: 'line', color: '#10b981' },
                { value: "Buyer's Market (−1)",  type: 'line', color: '#0ea5e9' },
              ]}
              wrapperStyle={{ fontSize: 12, color: '#c8c8c8' }}
            />
            <ReferenceLine y={0.2}   stroke="#10b981" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Seller's", position: 'right', fontSize: 10, fill: '#10b981' }} />
            <ReferenceLine y={0}     stroke="#6b7280" strokeDasharray="2 2" strokeWidth={1} />
            <ReferenceLine y={-0.2}  stroke="#0ea5e9" strokeDasharray="4 3" strokeWidth={1} label={{ value: "Buyer's", position: 'right', fontSize: 10, fill: '#0ea5e9' }} />
            <Area
              type="monotone"
              dataKey="score"
              name="Market Score"
              stroke="#9ca3af"
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
