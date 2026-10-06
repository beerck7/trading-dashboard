import type { Candle, MarketEvent } from "@/types/market";

export function summarizeCandles(candles: Candle[]) {
  if (!candles.length) return null;
  const first = candles[0];
  const last = candles[candles.length - 1];
  const returns = candles
    .slice(1)
    .map((candle, i) => Math.log(candle.close / candles[i].close));
  const mean =
    returns.reduce((sum, value) => sum + value, 0) / (returns.length || 1);
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (returns.length || 1);
  const totalVolume = candles.reduce((sum, candle) => sum + candle.volume, 0);
  return {
    change: ((last.close - first.open) / first.open) * 100,
    high: Math.max(...candles.map((candle) => candle.high)),
    low: Math.min(...candles.map((candle) => candle.low)),
    volume: totalVolume,
    volatility: Math.sqrt(variance) * 100, // Odchylenie standardowe dla pojedynczej świecy, bez annualizacji.
    vwap: totalVolume
      ? candles.reduce(
          (sum, candle) =>
            sum +
            ((candle.high + candle.low + candle.close) / 3) * candle.volume,
          0,
        ) / totalVolume
      : null,
  };
}

// Zdarzenia opisują dane, bez rekomendacji kupna lub sprzedaży.
export function deriveEvents(
  symbol: MarketEvent["symbol"],
  candles: Candle[],
): MarketEvent[] {
  const stats = summarizeCandles(candles);
  if (!stats || candles.length < 2) return [];
  const last = candles[candles.length - 1];
  return [
    {
      id: `${symbol}-momentum`,
      symbol,
      kind: "momentum",
      title:
        stats.change >= 0 ? "Upward price movement" : "Downward price movement",
      description: `Price moved ${stats.change >= 0 ? "+" : ""}${stats.change.toFixed(2)}% over the observed day.`,
      timestamp: last.time * 1000,
    },
    {
      id: `${symbol}-volume`,
      symbol,
      kind: "volume",
      title: "Volume observation",
      description: `${stats.volume.toFixed(0)} ${symbol.replace("USDT", "")} traded across the sampled candles.`,
      timestamp: last.time * 1000 - 900_000,
    },
    {
      id: `${symbol}-volatility`,
      symbol,
      kind: "volatility",
      title: "Volatility observation",
      description: `Per-candle return deviation is ${stats.volatility.toFixed(2)}%.`,
      timestamp: last.time * 1000 - 1_800_000,
    },
  ];
}
