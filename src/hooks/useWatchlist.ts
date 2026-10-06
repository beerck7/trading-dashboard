"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isAssetSymbol } from "@/constants/market";
import type { AssetSymbol } from "@/types/market";

const KEY = "signal:watchlist";
const DEFAULT = '["BTCUSDT","ETHUSDT"]';
const CHANGE_EVENT = "signal-watchlist-change";
let memoryValue = DEFAULT;

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(KEY) ?? memoryValue;
  } catch {
    return memoryValue;
  }
}

function decode(value: string): AssetSymbol[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter(
              (item): item is AssetSymbol =>
                typeof item === "string" && isAssetSymbol(item),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT);
  const watchlist = decode(snapshot);
  const toggle = useCallback((symbol: AssetSymbol) => {
    const current = decode(getSnapshot());
    memoryValue = JSON.stringify(
      current.includes(symbol)
        ? current.filter((item) => item !== symbol)
        : [...current, symbol],
    );
    try {
      window.localStorage.setItem(KEY, memoryValue);
    } catch {
      /* Przy zablokowanym localStorage lista działa w pamięci. */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return { watchlist, toggle };
}
