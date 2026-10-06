import "server-only";
import { getDemoCandles, getDemoMarkets } from "@/services/demo/data";
import type { AssetSymbol, Timeframe } from "@/types/market";
import { getLiveCandles, getLiveMarkets } from "./binance";
import { resolveDataMode } from "./config";

export function getDataMode() {
  return resolveDataMode(process.env.DATA_MODE);
}

export async function getCandles(symbol: AssetSymbol, timeframe: Timeframe) {
  return getDataMode() === "demo" ? getDemoCandles(symbol, timeframe) : getLiveCandles(symbol, timeframe);
}

export async function getMarkets() {
  return getDataMode() === "demo" ? getDemoMarkets() : getLiveMarkets();
}
