import type { RateData, StateMarketData, MarketInsight } from '../types';

interface Props {
  history: RateData[];
  stateData: StateMarketData | null;
  stateName: string;
}

function buildInsights(history: RateData[], stateData: StateMarketData | null): MarketInsight[] {
  const insights: MarketInsight[] = [];
  const valid30 = history.filter(d => d.rate30 !== null);
  if (valid30.length < 2) return insights;

  const current = valid30[valid30.length - 1].rate30!;
  const ago = (months: number) => {
    const target = valid30.length - Math.round((months * 4.33));
    return target >= 0 ? valid30[target].rate30 : null;
  };

  const chg3m  = ago(3)  !== null ? +(current - ago(3)!).toFixed(2)  : null;
  const chg6m  = ago(6)  !== null ? +(current - ago(6)!).toFixed(2)  : null;
  const chg12m = ago(12) !== null ? +(current - ago(12)!).toFixed(2) : null;

  if (chg3m !== null) {
    if (chg3m < -0.25) {
      insights.push({ text: `30-year rates have dropped ${Math.abs(chg3m).toFixed(2)}% over the last 3 months — potential window to lock in a lower rate.`, tag: 'buyer', type: 'positive' });
    } else if (chg3m > 0.25) {
      insights.push({ text: `Rates have climbed ${chg3m.toFixed(2)}% in the last 3 months. Buyers should consider locking sooner rather than later.`, tag: 'buyer', type: 'warning' });
    }
  }

  if (chg12m !== null) {
    if (chg12m < -0.5) {
      insights.push({ text: `Year-over-year rates are down ${Math.abs(chg12m).toFixed(2)}%, which is improving affordability for homebuyers.`, tag: 'buyer', type: 'positive' });
    } else if (chg12m > 0.5) {
      insights.push({ text: `Rates are ${chg12m.toFixed(2)}% higher than a year ago, reducing buyer purchasing power on a $400K loan by roughly $${Math.round(chg12m * 250)}/month.`, tag: 'buyer', type: 'warning' });
    }
  }

  const valid15 = history.filter(d => d.rate15 !== null);
  if (valid15.length && valid30.length) {
    const r15 = valid15[valid15.length - 1].rate15!;
    const r30 = valid30[valid30.length - 1].rate30!;
    const spread = +(r30 - r15).toFixed(2);
    if (spread < 0.4) {
      insights.push({ text: `The spread between 15-year (${r15.toFixed(2)}%) and 30-year (${r30.toFixed(2)}%) rates is unusually narrow at ${spread.toFixed(2)}%, making the 30-year more attractive than usual.`, tag: 'general', type: 'neutral' });
    } else if (spread > 1.0) {
      insights.push({ text: `A wide ${spread.toFixed(2)}% spread between 15-year and 30-year rates favors borrowers who can afford the higher payment of the shorter term.`, tag: 'buyer', type: 'neutral' });
    }
  }

  if (stateData?.daysOnMarket !== null && stateData?.daysOnMarket !== undefined) {
    const dom = stateData.daysOnMarket;
    if (dom < 25) {
      insights.push({ text: `Homes in this state sell in a median of ${Math.round(dom)} days — a fast-moving market that favors sellers and pressures buyers to decide quickly.`, tag: 'seller', type: 'positive' });
    } else if (dom > 60) {
      insights.push({ text: `At ${Math.round(dom)} median days on market, buyers have more negotiating leverage as homes are sitting longer.`, tag: 'buyer', type: 'positive' });
    } else {
      insights.push({ text: `Median days on market of ${Math.round(dom)} days indicates a balanced market with moderate competition.`, tag: 'general', type: 'neutral' });
    }
  }

  if (chg6m !== null && chg6m > 0 && stateData?.daysOnMarket !== null && stateData?.daysOnMarket !== undefined && stateData.daysOnMarket < 30) {
    insights.push({ text: `Rising rates combined with fast days on market signal continued seller strength despite affordability pressures.`, tag: 'seller', type: 'neutral' });
  }

  return insights.slice(0, 4);
}

const TAG_STYLES = {
  buyer:   'bg-sky-950/30 text-[#0ea5e9] border-sky-900',
  seller:  'bg-emerald-950/30 text-[#10b981] border-emerald-900',
  general: 'bg-[#1e1e1e] text-[#9ca3af] border-[#333333]',
};

const TYPE_STYLES = {
  positive: 'border-l-4 border-l-emerald-500',
  warning:  'border-l-4 border-l-orange-500',
  neutral:  'border-l-4 border-l-[#4b5563]',
};

export default function MarketPatternInsights({ history, stateData, stateName }: Props) {
  const insights = buildInsights(history, stateData);

  return (
    <div className="bg-[#111111] rounded-lg border border-[#2a2a2a] p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Market Pattern Insights — {stateName}</h2>
      {insights.length === 0 ? (
        <p className="text-sm text-[#6b7280]">Loading market insights…</p>
      ) : (
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-md bg-[#1a1a1a] p-4 ${TYPE_STYLES[ins.type]}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[#c8c8c8]">{ins.text}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize flex-shrink-0 ${TAG_STYLES[ins.tag]}`}>
                  {ins.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
