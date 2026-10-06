import { fetchJson } from "./http";
import { parseCandles, parseMarkets } from "./validation";

export async function fetchMarkets(url: string) {
  return parseMarkets(await fetchJson(url));
}

export async function fetchCandles(url: string) {
  return parseCandles(await fetchJson(url));
}
