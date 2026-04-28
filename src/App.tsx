import { useState, useEffect, useCallback } from 'react';
import RateCard from './components/RateCard';
import RateChart from './components/RateChart';
import StateSelector from './components/StateSelector';
import StateMarketData from './components/StateMarketData';
import ForecastInsights from './components/ForecastInsights';
import MarketPatternInsights from './components/MarketPatternInsights';
import NotificationToggle from './components/NotificationToggle';
import MarketConditionChart from './components/MarketConditionChart';
import LoadingSpinner from './components/LoadingSpinner';
import {
  fetchCurrentRates,
  fetchRateHistory,
  fetchStateMarketData,
  fetchMarketConditionHistory,
  detectStateFromGeolocation,
} from './utils/fredApi';
import { generateForecast } from './utils/forecasting';
import { computeMarketConditionScores } from './utils/marketCondition';
import { getStateByCode, STATES } from './utils/stateData';
import type { CurrentRates, RateData, StateMarketData as StateMarketDataType, ForecastResult, MarketConditionPoint, TimeRange } from './types';

const DEFAULT_STATE = 'TX';

export default function App() {
  const [currentRates, setCurrentRates]     = useState<CurrentRates | null>(null);
  const [rateHistory, setRateHistory]       = useState<RateData[]>([]);
  const [stateCode, setStateCode]           = useState(DEFAULT_STATE);
  const [stateData, setStateData]           = useState<StateMarketDataType | null>(null);
  const [marketCondition, setMarketCondition] = useState<MarketConditionPoint[]>([]);
  const [forecast, setForecast]             = useState<ForecastResult | null>(null);
  const [range, setRange]                   = useState<TimeRange>('2y');
  const [showForecast, setShowForecast]     = useState(false);

  const [loadingRates, setLoadingRates]     = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingState, setLoadingState]     = useState(false);
  const [loadingCondition, setLoadingCondition] = useState(false);
  const [geolocating, setGeolocating]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentRates()
      .then(setCurrentRates)
      .catch(e => setError(String(e)))
      .finally(() => setLoadingRates(false));
  }, []);

  useEffect(() => {
    setLoadingHistory(true);
    fetchRateHistory(range)
      .then(data => {
        setRateHistory(data);
        setForecast(generateForecast(data));
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoadingHistory(false));
  }, [range]);

  const loadStateData = useCallback(async (code: string) => {
    const state = getStateByCode(code);
    if (!state) return;

    setLoadingState(true);
    setLoadingCondition(true);
    setStateData(null);
    setMarketCondition([]);

    try {
      const [data, conditionHistory] = await Promise.all([
        fetchStateMarketData(state),
        fetchMarketConditionHistory(state),
      ]);
      setStateData(data);
      const scores = computeMarketConditionScores(
        conditionHistory.hpiHistory,
        conditionHistory.permitsHistory,
        conditionHistory.domHistory,
        conditionHistory.rate30History,
      );
      setMarketCondition(scores);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingState(false);
      setLoadingCondition(false);
    }
  }, []);

  useEffect(() => { loadStateData(stateCode); }, [stateCode, loadStateData]);

  async function handleGeolocate() {
    setGeolocating(true);
    try {
      const code = await detectStateFromGeolocation();
      if (code && STATES.find(s => s.code === code)) {
        setStateCode(code);
      }
    } finally {
      setGeolocating(false);
    }
  }

  const selectedState = getStateByCode(stateCode);

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="bg-[#080808] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0ea5e9] rounded flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">Mortgage Rates Tracker</h1>
              <p className="text-xs text-[#6b7280] hidden sm:block">
                <a href="https://irvinglopez.com" className="hover:text-[#0ea5e9] transition-colors">irvinglopez.com</a>
                {' '}· Powered by FRED
              </p>
            </div>
          </div>
          <NotificationToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-950/30 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-300">✕</button>
          </div>
        )}

        {loadingRates ? (
          <LoadingSpinner label="Fetching latest mortgage rates…" />
        ) : currentRates ? (
          <RateCard rates={currentRates} history={rateHistory} />
        ) : null}

        <RateChart
          history={rateHistory}
          forecast={forecast?.points ?? []}
          range={range}
          onRangeChange={setRange}
          showForecast={showForecast}
          onToggleForecast={() => setShowForecast(s => !s)}
          loading={loadingHistory}
        />

        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-base font-semibold text-[#c8c8c8]">State Market Data</h2>
            <StateSelector
              selectedCode={stateCode}
              onSelect={setStateCode}
              onGeolocate={handleGeolocate}
              geolocating={geolocating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <StateMarketData
              data={stateData}
              stateName={selectedState?.name ?? stateCode}
              loading={loadingState}
            />
            {currentRates && forecast ? (
              <ForecastInsights forecast={forecast} currentRates={currentRates} />
            ) : (
              <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
                <LoadingSpinner label="Building forecast…" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <MarketConditionChart
              data={marketCondition}
              stateName={selectedState?.name ?? stateCode}
              loading={loadingCondition}
            />
            <MarketPatternInsights
              history={rateHistory}
              stateData={stateData}
              stateName={selectedState?.name ?? stateCode}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#080808] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-[#4b5563] flex flex-wrap gap-4 justify-between items-center">
          <span>Data: FRED / Federal Reserve Bank of St. Louis · MORTGAGE15US · MORTGAGE30US</span>
          <span>Forecasts are algorithmic estimates, not financial advice.</span>
          <a href="https://irvinglopez.com" className="text-[#4b5563] hover:text-[#0ea5e9] transition-colors">
            Part of irvinglopez.com ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
