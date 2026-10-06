import { ASSETS, TIMEFRAMES } from "@/constants/market";
import type { AssetSymbol, Candle, CandlesResponse, MarketsResponse, Timeframe } from "@/types/market";
import { deriveEvents } from "@/utils/analytics";

// Illustrative snapshot: synthetic, deterministic, never passed off as current market prices.
export const DEMO_AS_OF = "2026-10-02T16:00:00.000Z";
const SNAPSHOT = {
  BTCUSDT: { price: 67432.8, change: 2.34, volume: 28_540_000_000 },
  ETHUSDT: { price: 3521.64, change: 1.87, volume: 14_820_000_000 },
  SOLUSDT: { price: 148.92, change: -0.82, volume: 3_260_000_000 },
  BNBUSDT: { price: 589.23, change: 0.64, volume: 1_470_000_000 },
} satisfies Record<AssetSymbol, { price: number; change: number; volume: number }>;

export function getDemoCandles(symbol: AssetSymbol, timeframe: Timeframe): CandlesResponse {
  const config = TIMEFRAMES.find((item) => item.value === timeframe)!;
  const snapshot = SNAPSHOT[symbol];
  const end = Date.parse(DEMO_AS_OF) / 1000;
  const periodFactor = config.count * config.seconds / 86400;
  const startPrice = snapshot.price / (1 + snapshot.change * periodFactor / 100);
  const candles: Candle[] = [];
  for (let index = 0; index < config.count; index++) {
    const progress = (index + 1) / config.count;
    const wave = Math.sin(progress * Math.PI * 7) * Math.sin(progress * Math.PI) * snapshot.price * 0.004;
    const close = startPrice + (snapshot.price - startPrice) * progress + wave;
    const open = index ? candles[index - 1].close : startPrice;
    const spread = snapshot.price * (0.0006 + Math.abs(Math.sin(index * 2.3)) * 0.0008);
    candles.push({ time: end - (config.count - 1 - index) * config.seconds, open, close,
      high: Math.max(open, close) + spread, low: Math.min(open, close) - spread,
      volume: snapshot.volume / snapshot.price * config.seconds / 86400 * (0.65 + Math.abs(Math.cos(index * 1.7)) * 0.7) });
  }
  return { symbol, timeframe, candles, mode: "demo", asOf: DEMO_AS_OF };
}

export function getDemoMarkets(): MarketsResponse {
  const assets = ASSETS.map((asset) => {
    const snapshot = SNAPSHOT[asset.symbol];
    const { candles } = getDemoCandles(asset.symbol, "1d");
    return { symbol: asset.symbol, name: asset.name, ticker: asset.ticker, price: snapshot.price,
      change24h: snapshot.change, volume24h: snapshot.volume,
      high24h: Math.max(...candles.map((candle) => candle.high)), low24h: Math.min(...candles.map((candle) => candle.low)),
      sparkline: candles.filter((_, index) => index % 4 === 0).map((candle) => candle.close) };
  });
  return { assets, events: ASSETS.flatMap((asset) => deriveEvents(asset.symbol, getDemoCandles(asset.symbol, "1d").candles)), mode: "demo", asOf: DEMO_AS_OF };
}
