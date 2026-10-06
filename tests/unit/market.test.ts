import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSETS, TIMEFRAMES } from "../../src/constants/market";
import { fetchJson, ApiError } from "../../src/services/api/http";
import { parseCandles, parseMarkets } from "../../src/services/api/validation";
import { getDemoCandles, getDemoMarkets } from "../../src/services/demo/data";
import { summarizeCandles } from "../../src/utils/analytics";
import { resolveDataMode } from "../../src/services/api/config";
import { getLiveCandles, getLiveMarkets } from "../../src/services/api/binance";
import { formatSnapshot } from "../../src/utils/formatters";

test("every demo asset and timeframe yields valid, ordered, deterministic OHLCV data", () => {
  for (const asset of ASSETS) for (const timeframe of TIMEFRAMES) {
    const response = getDemoCandles(asset.symbol, timeframe.value);
    assert.deepEqual(parseCandles(response), getDemoCandles(asset.symbol, timeframe.value));
    assert.equal(response.candles.length, timeframe.count);
    assert.equal(response.candles[1].time - response.candles[0].time, timeframe.seconds);
  }
});

test("demo market prices agree with the final daily candle and daily change", () => {
  const markets = parseMarkets(getDemoMarkets());
  for (const asset of markets.assets) {
    const candles = getDemoCandles(asset.symbol, "1d").candles;
    assert.equal(candles.at(-1)?.close, asset.price);
    assert.ok(Math.abs(summarizeCandles(candles)!.change - asset.change24h) < 0.000001);
  }
});

test("validation rejects malformed, non-finite, unordered and duplicate data", () => {
  const response = getDemoCandles("BTCUSDT", "1d");
  assert.throws(() => parseCandles({ ...response, candles: [{ ...response.candles[0], close: NaN }] }));
  assert.throws(() => parseCandles({ ...response, candles: [...response.candles].reverse() }));
  assert.throws(() => parseCandles({ ...response, candles: [response.candles[0], response.candles[0]] }));
  assert.throws(() => parseCandles({ ...response, candles: [{ ...response.candles[0], high: 1 }] }));
  const markets = getDemoMarkets();
  assert.throws(() => parseMarkets({ ...markets, assets: [markets.assets[0], markets.assets[0]] }));
  assert.throws(() => parseMarkets({ ...markets, asOf: "invalid" }));
});

test("valid empty responses can reach the UI empty states", () => {
  assert.equal(parseCandles({ ...getDemoCandles("BTCUSDT", "1d"), candles: [] }).candles.length, 0);
  assert.equal(parseMarkets({ ...getDemoMarkets(), assets: [], events: [] }).assets.length, 0);
  assert.equal(summarizeCandles([]), null);
});

test("analytics handles flat prices and zero volume without dividing by zero", () => {
  const candles = [1, 2].map((time) => ({ time, open: 100, close: 100, high: 100, low: 100, volume: 0 }));
  assert.deepEqual(summarizeCandles(candles), { change: 0, high: 100, low: 100, volume: 0, volatility: 0, vwap: null });
});

test("HTTP failures, invalid JSON, network failures and timeout become controlled errors", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response("{}", { status: 503 }));
  await assert.rejects(fetchJson("https://example.test"), (error: unknown) => error instanceof ApiError && error.status === 503);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => new Response("invalid JSON"));
  await assert.rejects(fetchJson("https://example.test"), ApiError);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  await assert.rejects(fetchJson("https://example.test"), ApiError);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", (_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
    options.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
  }));
  await assert.rejects(fetchJson("https://example.test", 5), (error: unknown) => error instanceof ApiError && error.status === 408);
});

test("live data is the default, demo is explicit and invalid modes fail", () => {
  assert.equal(resolveDataMode(undefined), "live");
  assert.equal(resolveDataMode("live"), "live");
  assert.equal(resolveDataMode("demo"), "demo");
  assert.throws(() => resolveDataMode("invalid"), (error: unknown) => error instanceof ApiError && error.status === 503);
});

test("public Binance responses map to validated live prices, candles and observations", async (context) => {
  const rows = [[1791197100000, "100", "105", "99", "102", "10"], [1791198000000, "102", "106", "101", "104", "20"]];
  context.mock.method(globalThis, "fetch", async (input: string) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://data-api.binance.vision");
    const payload = url.pathname.endsWith("/klines") ? rows : { symbol: url.searchParams.get("symbol"), lastPrice: "104", priceChangePercent: "4", quoteVolume: "5000", highPrice: "106", lowPrice: "99" };
    return Response.json(payload);
  });
  const markets = await getLiveMarkets();
  assert.equal(markets.mode, "live");
  assert.equal(markets.assets.length, 4);
  assert.equal(markets.events.length, 12);
  assert.equal(markets.assets[0].price, 104);
  assert.equal(markets.assets[0].change24h, 4);
  const chart = await getLiveCandles("ETHUSDT", "1d");
  assert.equal(chart.mode, "live");
  assert.equal(chart.candles[1].time, 1791198000);
  assert.equal(chart.candles[1].close, 104);
});

test("live provider rejects failures and malformed upstream data without substituting demo", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response("{}", { status: 451 }));
  await assert.rejects(getLiveMarkets(), (error: unknown) => error instanceof ApiError && error.status === 451);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => Response.json([[1791198000000, "bad", "106", "99", "104", "20"]]));
  await assert.rejects(getLiveCandles("BTCUSDT", "1d"), /invalid response/);
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => Response.json({ error: "unavailable" }));
  await assert.rejects(getLiveCandles("BTCUSDT", "1d"), ApiError);
});

test("live snapshot shows the precise update time in UTC", () => {
  assert.equal(formatSnapshot("2026-10-05T12:34:56Z", true), "05 Oct 2026 · 12:34:56 UTC");
  assert.equal(formatSnapshot("2026-10-02T16:00:00Z"), "02 Oct 2026");
});
