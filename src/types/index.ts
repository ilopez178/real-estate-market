export interface FredObservation {
  date: string;
  value: string;
}

export interface RateData {
  date: string;
  rate15: number | null;
  rate30: number | null;
}

export interface CurrentRates {
  rate15: number;
  rate30: number;
  date15: string;
  date30: string;
}

export interface StateMarketData {
  existingSales: number | null;
  existingSalesDate: string | null;
  homePrice: number | null;
  homePriceDate: string | null;
  buildingPermits: number | null;
  buildingPermitsDate: string | null;
  daysOnMarket: number | null;
  daysOnMarketDate: string | null;
}

export interface StateInfo {
  code: string;
  name: string;
  fredCodes: {
    sthpi: string;
    permits: string;
    daysOnMarket: string;
    existingSales?: string;
  };
}

export type TimeRange = '2y' | '5y' | '10y';
export type Grouping = 'daily' | 'weekly' | 'monthly' | 'annually';

export interface ForecastPoint {
  date: string;
  rate15: number;
  rate30: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  trend15: 'increasing' | 'decreasing' | 'stable';
  trend30: 'increasing' | 'decreasing' | 'stable';
  confidence: 'high' | 'moderate' | 'low';
  change15: number;
  change30: number;
}

export interface MarketInsight {
  text: string;
  tag: 'buyer' | 'seller' | 'general';
  type: 'positive' | 'warning' | 'neutral';
}

export interface MarketConditionPoint {
  date: string;
  score: number;
  label: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
