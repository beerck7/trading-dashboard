import { ASSETS, TIMEFRAMES } from "@/constants/market";
import type {
  AssetSymbol,
  CandlesResponse,
  MarketsResponse,
  Timeframe,
} from "@/types/market";
import { deriveEvents } from "@/utils/analytics";
import { ApiError, fetchJson } from "./http";
import { isRecord, parseCandles, parseMarkets } from "./validation";

// Publiczny endpoint Binance z danymi rynkowymi, bez klucza API.
const BINANCE_URL = "https://data-api.binance.vision/api/v3";

export async function getLiveCandles(
  symbol: AssetSymbol,
  timeframe: Timeframe,
): Promise<CandlesResponse> {
  const config = TIMEFRAMES.find((item) => item.value === timeframe)!;
  const payload = await fetchJson(
    `${BINANCE_URL}/klines?symbol=${symbol}&interval=${config.interval}&limit=${config.count}`,
  );
  if (
    !Array.isArray(payload) ||
    !payload.every((row) => Array.isArray(row) && row.length >= 6)
  )
    throw new ApiError(
      "The upstream chart service returned invalid data.",
      502,
    );
  return parseCandles({
    symbol,
    timeframe,
    mode: "live",
    asOf: new Date().toISOString(),
    candles: payload.map((row: unknown[]) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    })),
  });
}

export async function getLiveMarkets(): Promise<MarketsResponse> {
  const results = await Promise.all(
    ASSETS.map(async (asset) => {
      const [ticker, chart] = await Promise.all([
        fetchJson(`${BINANCE_URL}/ticker/24hr?symbol=${asset.symbol}`),
        getLiveCandles(asset.symbol, "1d"),
      ]);
      if (!isRecord(ticker) || ticker.symbol !== asset.symbol)
        throw new ApiError(
          "The upstream market service returned invalid data.",
          502,
        );
      return {
        asset: {
          symbol: asset.symbol,
          name: asset.name,
          ticker: asset.ticker,
          price: Number(ticker.lastPrice),
          change24h: Number(ticker.priceChangePercent),
          volume24h: Number(ticker.quoteVolume),
          high24h: Number(ticker.highPrice),
          low24h: Number(ticker.lowPrice),
          sparkline: chart.candles
            .filter((_, index) => index % 4 === 0)
            .map((candle) => candle.close),
        },
        events: deriveEvents(asset.symbol, chart.candles),
      };
    }),
  );
  return parseMarkets({
    assets: results.map((result) => result.asset),
    events: results.flatMap((result) => result.events),
    mode: "live",
    asOf: new Date().toISOString(),
  });
}
