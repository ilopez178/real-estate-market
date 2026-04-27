import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CurrentRates, RateData } from '../types';

interface Props {
  rates: CurrentRates;
  history: RateData[];
}

function weekChange(history: RateData[], key: 'rate15' | 'rate30'): number | null {
  const valid = history.filter(d => d[key] !== null);
  if (valid.length < 2) return null;
  const latest = valid[valid.length - 1][key]!;
  const prev   = valid[valid.length - 2][key]!;
  return +(latest - prev).toFixed(2);
}

function TrendIcon({ change }: { change: number | null }) {
  if (change === null) return <Minus className="w-4 h-4 text-[#6b7280]" />;
  if (change > 0) return <TrendingUp className="w-4 h-4 text-red-400" />;
  if (change < 0) return <TrendingDown className="w-4 h-4 text-emerald-400" />;
  return <Minus className="w-4 h-4 text-[#6b7280]" />;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RateCard({ rates, history }: Props) {
  const chg15 = weekChange(history, 'rate15');
  const chg30 = weekChange(history, 'rate30');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 15-year */}
      <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] hover:border-[#333333] transition-colors p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-[#6b7280] uppercase tracking-wide">15-Year Fixed</span>
          <span className="text-xs text-[#4b5563]">MORTGAGE15US</span>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-4xl font-bold text-[#10b981]">{rates.rate15.toFixed(2)}%</span>
          <div className="flex items-center gap-1 mb-1">
            <TrendIcon change={chg15} />
            {chg15 !== null && (
              <span className={`text-sm font-medium ${chg15 > 0 ? 'text-red-400' : chg15 < 0 ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
                {chg15 > 0 ? '+' : ''}{chg15.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-[#4b5563] mt-2">As of {formatDate(rates.date15)}</p>
      </div>

      {/* 30-year */}
      <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] hover:border-[#333333] transition-colors p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-[#6b7280] uppercase tracking-wide">30-Year Fixed</span>
          <span className="text-xs text-[#4b5563]">MORTGAGE30US</span>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-4xl font-bold text-[#0ea5e9]">{rates.rate30.toFixed(2)}%</span>
          <div className="flex items-center gap-1 mb-1">
            <TrendIcon change={chg30} />
            {chg30 !== null && (
              <span className={`text-sm font-medium ${chg30 > 0 ? 'text-red-400' : chg30 < 0 ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
                {chg30 > 0 ? '+' : ''}{chg30.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-[#4b5563] mt-2">As of {formatDate(rates.date30)}</p>
      </div>
    </div>
  );
}
