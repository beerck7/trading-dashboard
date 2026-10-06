import { useCandles } from "@/hooks/useMarketData";
import { Icon } from "@/components/ui/Icon";
import type { AssetSymbol } from "@/types/market";
import { summarizeCandles } from "@/utils/analytics";
import { formatPercent, formatUsd } from "@/utils/formatters";

export function AnalyticsCards({ symbol }: { symbol: AssetSymbol }) {
  const { data, error } = useCandles(symbol, "1d");
  const stats = data ? summarizeCandles(data.candles) : null;
  return <div className="analytics-grid">
    <article className="panel analytic-card"><div className="analytic-label"><Icon name="chart" />Daily momentum</div><strong className={stats && stats.change < 0 ? "negative" : "positive"}>{stats ? formatPercent(stats.change) : "—"}</strong><p>{error ? "Last available snapshot" : "First open to last close · 1D"}</p></article>
    <article className="panel analytic-card"><div className="analytic-label"><Icon name="activity" />Return volatility</div><strong>{stats ? `${stats.volatility.toFixed(2)}%` : "—"}</strong><p>Standard deviation · 15m returns</p></article>
    <article className="panel analytic-card"><div className="analytic-label"><Icon name="pulse" />Volume weighted price</div><strong>{stats?.vwap != null ? formatUsd(stats.vwap) : "—"}</strong><p>Typical price × base volume · 1D</p></article>
  </div>;
}
