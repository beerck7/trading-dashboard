export type AssetSymbol = "BTCUSDT" | "ETHUSDT" | "SOLUSDT" | "BNBUSDT";
export type Timeframe = "1h" | "4h" | "1d" | "1w";
export type DataMode = "demo" | "live";

export interface Asset {
  symbol: AssetSymbol;
  name: string;
  ticker: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
}

export interface Candle {
  time: number; // Unix seconds, sorted ascending.
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketEvent {
  id: string;
  symbol: AssetSymbol;
  kind: "momentum" | "volume" | "volatility";
  title: string;
  description: string;
  timestamp: number;
}

export interface MarketsResponse {
  assets: Asset[];
  events: MarketEvent[];
  mode: DataMode;
  asOf: string;
}

export interface CandlesResponse {
  symbol: AssetSymbol;
  timeframe: Timeframe;
  candles: Candle[];
  mode: DataMode;
  asOf: string;
}
