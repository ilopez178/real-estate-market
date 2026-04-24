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
    increasing: { label: 'Rising', color: 'text-red-600 bg-red-50 border-red-200', icon: TrendingUp },
    decreasing: { label: 'Falling', color: 'text-green-700 bg-green-50 border-green-200', icon: TrendingDown },
    stable:     { label: 'Stable',  color: 'text-gray-600 bg-gray-50 border-gray-200', icon: Minus },
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
    high:     { label: 'High Confidence',     icon: CheckCircle, color: 'text-green-700' },
    moderate: { label: 'Moderate Confidence', icon: Info,         color: 'text-yellow-700' },
    low:      { label: 'Low Confidence',      icon: AlertCircle, color: 'text-red-600' },
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">30-Day Forecast</h2>
        <ConfidenceBadge level={forecast.confidence} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* 15-year forecast */}
        <div className="bg-green-50 rounded-md p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">15-Year</div>
          <div className="flex items-center gap-2 mb-1">
            <TrendBadge trend={forecast.trend15} />
          </div>
          <div className={`text-lg font-bold ${forecast.change15 > 0 ? 'text-red-600' : forecast.change15 < 0 ? 'text-green-700' : 'text-gray-600'}`}>
            {forecast.change15 > 0 ? '+' : ''}{forecast.change15.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">over 30 days</div>
        </div>

        {/* 30-year forecast */}
        <div className="bg-blue-50 rounded-md p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">30-Year</div>
          <div className="flex items-center gap-2 mb-1">
            <TrendBadge trend={forecast.trend30} />
          </div>
          <div className={`text-lg font-bold ${forecast.change30 > 0 ? 'text-red-600' : forecast.change30 < 0 ? 'text-green-700' : 'text-gray-600'}`}>
            {forecast.change30 > 0 ? '+' : ''}{forecast.change30.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">over 30 days</div>
        </div>
      </div>

      {/* Monthly payment impact */}
      <div className="border-t border-gray-100 pt-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Payment Impact — $400K Loan</div>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs text-gray-400">Current</div>
            <div className="text-base font-semibold text-gray-800">${currentPayment30.toFixed(0)}/mo</div>
          </div>
          <div className="text-gray-300">→</div>
          <div>
            <div className="text-xs text-gray-400">Projected</div>
            <div className="text-base font-semibold text-gray-800">${forecastedPayment30.toFixed(0)}/mo</div>
          </div>
          <div className={`ml-auto text-sm font-semibold ${paymentDelta > 0 ? 'text-red-600' : paymentDelta < 0 ? 'text-green-700' : 'text-gray-500'}`}>
            {paymentDelta > 0 ? '+' : ''}${paymentDelta.toFixed(0)}/mo
          </div>
        </div>
      </div>
    </div>
  );
}
