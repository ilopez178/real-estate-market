import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { ForecastResult, CurrentRates } from '../types';
import { monthlyPayment } from '../utils/forecasting';

interface Props {
  forecast: ForecastResult;
  currentRates: CurrentRates;
}

const LOAN_AMOUNT = 400_000;
const LOAN_TERM = 30;

function TrendBadge({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) {
  const map = {
    increasing: { label: 'Rising', color: 'text-red-400 bg-red-950/30 border-red-900', icon: TrendingUp },
    decreasing: { label: 'Falling', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900', icon: TrendingDown },
    stable:     { label: 'Stable',  color: 'text-[#6b7280] bg-[#1a1a1a] border-[#333333]', icon: Minus },
  };
  const { label, color, icon: Icon } = map[trend];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'moderate' | 'low' }) {
  const map = {
    high:     { label: 'High Confidence',     icon: CheckCircle, color: 'text-emerald-400' },
    moderate: { label: 'Moderate Confidence', icon: Info,         color: 'text-yellow-400' },
    low:      { label: 'Low Confidence',      icon: AlertCircle, color: 'text-red-400' },
  };
  const { label, icon: Icon, color } = map[level];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

export default function ForecastInsights({ forecast, currentRates }: Props) {
  const currentPayment30 = monthlyPayment(LOAN_AMOUNT, currentRates.rate30, LOAN_TERM);
  const forecastedPayment30 = monthlyPayment(
    LOAN_AMOUNT,
    currentRates.rate30 + forecast.change30,
    LOAN_TERM
  );
  const paymentDelta = forecastedPayment30 - currentPayment30;

  return (
    <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">30-Day Forecast</h2>
        <ConfidenceBadge level={forecast.confidence} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-md p-4">
          <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">15-Year</div>
          <div className="flex items-center gap-2 mb-1">
            <TrendBadge trend={forecast.trend15} />
          </div>
          <div className={`text-lg font-bold ${forecast.change15 > 0 ? 'text-red-400' : forecast.change15 < 0 ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
            {forecast.change15 > 0 ? '+' : ''}{forecast.change15.toFixed(2)}%
          </div>
          <div className="text-xs text-[#4b5563] mt-1">over 30 days</div>
        </div>

        <div className="bg-sky-950/20 border border-sky-900/30 rounded-md p-4">
          <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">30-Year</div>
          <div className="flex items-center gap-2 mb-1">
            <TrendBadge trend={forecast.trend30} />
          </div>
          <div className={`text-lg font-bold ${forecast.change30 > 0 ? 'text-red-400' : forecast.change30 < 0 ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
            {forecast.change30 > 0 ? '+' : ''}{forecast.change30.toFixed(2)}%
          </div>
          <div className="text-xs text-[#4b5563] mt-1">over 30 days</div>
        </div>
      </div>

      <div className="border-t border-[#2a2a2a] pt-4">
        <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Payment Impact — $400K Loan</div>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-[#4b5563]">Current</div>
            <div className="text-base font-semibold text-[#c8c8c8]">${currentPayment30.toFixed(0)}/mo</div>
          </div>
          <div className="text-[#4b5563]">→</div>
          <div>
            <div className="text-xs text-[#4b5563]">Projected</div>
            <div className="text-base font-semibold text-[#c8c8c8]">${forecastedPayment30.toFixed(0)}/mo</div>
          </div>
          <div className={`ml-auto text-sm font-semibold ${paymentDelta > 0 ? 'text-red-400' : paymentDelta < 0 ? 'text-emerald-400' : 'text-[#6b7280]'}`}>
            {paymentDelta > 0 ? '+' : ''}${paymentDelta.toFixed(0)}/mo
          </div>
        </div>
      </div>
    </div>
  );
}
