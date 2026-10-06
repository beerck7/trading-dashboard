import { AssetBadge } from "@/components/ui/AssetBadge";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";
import type { Asset, AssetSymbol } from "@/types/market";
import { formatPercent, formatUsd } from "@/utils/formatters";

export function AssetCards({ assets, selected, onSelect, quoteCurrency = "USD" }: { assets: Asset[]; selected: AssetSymbol; onSelect: (symbol: AssetSymbol) => void; quoteCurrency?: "USD" | "USDT" }) {
  return <div className="asset-grid">{assets.map((asset) => <button key={asset.symbol} className={`panel asset-card ${selected === asset.symbol ? "selected" : ""}`} aria-pressed={selected === asset.symbol} aria-label={`Select ${asset.name}`} onClick={() => onSelect(asset.symbol)}>
    <span className="asset-card-header"><AssetBadge symbol={asset.symbol} /><span className="asset-name"><strong>{asset.name}</strong><span>{asset.ticker} / {quoteCurrency}</span></span><Icon name="arrow" size={16} /></span>
    <span className="asset-card-value">{formatUsd(asset.price)}</span>
    <span className="asset-card-footer"><span className={asset.change24h >= 0 ? "positive" : "negative"}>{formatPercent(asset.change24h)} <span className="muted">24h</span></span><Sparkline data={asset.sparkline} positive={asset.change24h >= 0} /></span>
  </button>)}</div>;
}
