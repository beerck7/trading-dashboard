import { isAssetSymbol, isTimeframe } from "@/constants/market";
import type {
  Asset,
  Candle,
  CandlesResponse,
  MarketEvent,
  MarketsResponse,
} from "@/types/market";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(isFiniteNumber);
const isDateString = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

export function isCandle(value: unknown): value is Candle {
  if (!isRecord(value)) return false;
  return (
    [
      value.time,
      value.open,
      value.high,
      value.low,
      value.close,
      value.volume,
    ].every(isFiniteNumber) &&
    Number.isInteger(value.time) &&
    Number(value.time) > 0 &&
    Number(value.low) > 0 &&
    Number(value.volume) >= 0 &&
    Number(value.high) >= Math.max(Number(value.open), Number(value.close)) &&
    Number(value.low) <= Math.min(Number(value.open), Number(value.close))
  );
}

function isAsset(value: unknown): value is Asset {
  return (
    isRecord(value) &&
    typeof value.symbol === "string" &&
    isAssetSymbol(value.symbol) &&
    typeof value.name === "string" &&
    typeof value.ticker === "string" &&
    [
      value.price,
      value.change24h,
      value.volume24h,
      value.high24h,
      value.low24h,
    ].every(isFiniteNumber) &&
    Number(value.price) > 0 &&
    Number(value.low24h) > 0 &&
    Number(value.volume24h) >= 0 &&
    Number(value.high24h) >= Number(value.price) &&
    Number(value.low24h) <= Number(value.price) &&
    isNumberArray(value.sparkline)
  );
}

function isEvent(value: unknown): value is MarketEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.symbol === "string" &&
    isAssetSymbol(value.symbol) &&
    ["momentum", "volume", "volatility"].includes(String(value.kind)) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isFiniteNumber(value.timestamp)
  );
}

export function parseMarkets(value: unknown): MarketsResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.assets) ||
    !value.assets.every(isAsset) ||
    new Set(value.assets.map((asset) => asset.symbol)).size !==
      value.assets.length ||
    !Array.isArray(value.events) ||
    !value.events.every(isEvent) ||
    !["demo", "live"].includes(String(value.mode)) ||
    !isDateString(value.asOf)
  ) {
    throw new Error("The market service returned an invalid response.");
  }
  return value as unknown as MarketsResponse;
}

export function parseCandles(value: unknown): CandlesResponse {
  if (
    !isRecord(value) ||
    typeof value.symbol !== "string" ||
    !isAssetSymbol(value.symbol) ||
    typeof value.timeframe !== "string" ||
    !isTimeframe(value.timeframe) ||
    !Array.isArray(value.candles) ||
    !value.candles.every(isCandle) ||
    value.candles.some(
      (candle, index, candles) =>
        index > 0 && candle.time <= candles[index - 1].time,
    ) ||
    !["demo", "live"].includes(String(value.mode)) ||
    !isDateString(value.asOf)
  ) {
    throw new Error("The chart service returned an invalid response.");
  }
  return value as unknown as CandlesResponse;
}
