import { ASSETS } from "@/constants/market";
import type { AssetSymbol } from "@/types/market";

export function AssetBadge({ symbol, small = false }: { symbol: AssetSymbol; small?: boolean }) {
  const asset = ASSETS.find((item) => item.symbol === symbol)!;
  return <span className={`asset-badge ${small ? "small" : ""}`} style={{ color: asset.color, backgroundColor: `${asset.color}18` }} aria-hidden="true">{asset.mark}</span>;
}
