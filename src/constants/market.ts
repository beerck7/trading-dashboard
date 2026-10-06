import type { AssetSymbol, Timeframe } from "@/types/market";

export const ASSETS = [
  {
    symbol: "BTCUSDT",
    ticker: "BTC",
    name: "Bitcoin",
    mark: "₿",
    color: "#f5a745",
  },
  {
    symbol: "ETHUSDT",
    ticker: "ETH",
    name: "Ethereum",
    mark: "Ξ",
    color: "#a6a9ef",
  },
  {
    symbol: "SOLUSDT",
    ticker: "SOL",
    name: "Solana",
    mark: "◎",
    color: "#8ddac1",
  },
  {
    symbol: "BNBUSDT",
    ticker: "BNB",
    name: "BNB",
    mark: "◇",
    color: "#ead16b",
  },
] as const;

export const TIMEFRAMES = [
  { value: "1h", label: "1H", interval: "1m", seconds: 60, count: 60 },
  { value: "4h", label: "4H", interval: "5m", seconds: 300, count: 48 },
  { value: "1d", label: "1D", interval: "15m", seconds: 900, count: 96 },
  { value: "1w", label: "1W", interval: "1h", seconds: 3600, count: 168 },
] as const;

export function isAssetSymbol(value: string): value is AssetSymbol {
  return ASSETS.some((asset) => asset.symbol === value);
}

export function isTimeframe(value: string): value is Timeframe {
  return TIMEFRAMES.some((timeframe) => timeframe.value === value);
}

export const REQUEST_TIMEOUT_MS = 8_000;
export const REFRESH_INTERVAL_MS = 60_000;
