import { Home, TrendingUp, Clock, Building } from 'lucide-react';
import type { StateMarketData as Data } from '../types';

interface Props {
  data: Data | null;
  stateName: string;
  loading: boolean;
}

function formatDate(d: string | null): string {
  if (!d) return '';
  const [y, m] = d.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  date: string | null;
  note?: string;
}

function MetricCard({ icon, label, value, date, note }: MetricCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#0ea5e9]">{icon}</span>
        <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value ?? <span className="text-[#4b5563] text-base font-normal">N/A</span>}</div>
      {date && <div className="text-xs text-[#4b5563] mt-1">{formatDate(date)}</div>}
      {note && <div className="text-xs text-[#4b5563] mt-0.5">{note}</div>}
    </div>
  );
}

export default function StateMarketData({ data, stateName, loading }: Props) {
  return (
    <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">{stateName} Market Data</h2>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-md h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Home Price Index"
            value={data?.homePrice !== null && data?.homePrice !== undefined ? data.homePrice.toFixed(1) : null}
            date={data?.homePriceDate ?? null}
            note="State HPI (Index)"
          />
          <MetricCard
            icon={<Home className="w-4 h-4" />}
            label="Existing Sales"
            value={data?.existingSales !== null && data?.existingSales !== undefined
              ? (data.existingSales / 1000).toFixed(1) + 'K' : null}
            date={data?.existingSalesDate ?? null}
            note="Annual units"
          />
          <MetricCard
            icon={<Building className="w-4 h-4" />}
            label="Building Permits"
            value={data?.buildingPermits !== null && data?.buildingPermits !== undefined
              ? data.buildingPermits.toLocaleString() : null}
            date={data?.buildingPermitsDate ?? null}
            note="Private housing units"
          />
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Days on Market"
            value={data?.daysOnMarket !== null && data?.daysOnMarket !== undefined
              ? `${Math.round(data.daysOnMarket)} days` : null}
            date={data?.daysOnMarketDate ?? null}
            note="Median"
          />
        </div>
      )}
    </div>
  );
}
