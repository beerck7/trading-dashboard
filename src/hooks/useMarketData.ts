"use client";

import useSWR from "swr";
import { REFRESH_INTERVAL_MS } from "@/constants/market";
import { fetchCandles, fetchMarkets } from "@/services/api/client";
import { ApiError } from "@/services/api/http";
import type { AssetSymbol, Timeframe } from "@/types/market";

const options = {
  refreshInterval: REFRESH_INTERVAL_MS,
  revalidateOnFocus: true,
  dedupingInterval: 5_000,
  errorRetryCount: 2,
  errorRetryInterval: 3_000,
  shouldRetryOnError: (error: Error) =>
    error instanceof ApiError &&
    (error.status === 408 || error.status === 429 || error.status >= 500),
};

export function useMarkets() {
  return useSWR("/api/markets", fetchMarkets, options);
}

export function useCandles(symbol: AssetSymbol, timeframe: Timeframe) {
  // Symbol i zakres tworzą klucz cache, aby nie wyświetlać danych poprzedniego wyboru.
  return useSWR(
    `/api/candles?symbol=${symbol}&timeframe=${timeframe}`,
    fetchCandles,
    options,
  );
}
