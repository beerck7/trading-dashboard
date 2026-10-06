"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { TIMEFRAMES } from "@/constants/market";
import { useCandles } from "@/hooks/useMarketData";
import { AssetBadge } from "@/components/ui/AssetBadge";
import { DataState } from "@/components/ui/DataState";
import { Icon } from "@/components/ui/Icon";
import type { Asset, Timeframe } from "@/types/market";
import { summarizeCandles } from "@/utils/analytics";
import {
  formatCompactNumber,
  formatPercent,
  formatUsd,
} from "@/utils/formatters";

const PriceChart = dynamic(() => import("@/components/chart/PriceChart"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton chart-skeleton"
      role="status"
      aria-label="Loading chart"
    />
  ),
});

export function ChartPanel({
  asset,
  quoteCurrency = "USD",
}: {
  asset: Asset;
  quoteCurrency?: "USD" | "USDT";
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1d");
  const [variant, setVariant] = useState<"candles" | "area">("candles");
  const [showData, setShowData] = useState(false);
  const { data, error, isLoading, isValidating, mutate } = useCandles(
    asset.symbol,
    timeframe,
  );
  const stats = data ? summarizeCandles(data.candles) : null;
  const period = TIMEFRAMES.find((item) => item.value === timeframe)!.label;

  return (
    <section
      id="analytics"
      tabIndex={-1}
      className="panel chart-panel"
      aria-labelledby="chart-heading"
    >
      <div className="chart-header">
        <div className="chart-asset">
          <AssetBadge symbol={asset.symbol} />
          <div>
            <h2 id="chart-heading">
              {asset.name}{" "}
              <span>
                {asset.ticker} / {quoteCurrency}
              </span>
            </h2>
            <p>
              Price performance{" "}
              <span className="muted">
                · {data?.mode === "live" ? "Binance Spot" : "Demo snapshot"}
              </span>
            </p>
          </div>
        </div>
        <div className="chart-price">
          <strong>{formatUsd(asset.price)}</strong>
          <span className={asset.change24h >= 0 ? "positive" : "negative"}>
            {formatPercent(asset.change24h)} <span className="muted">24h</span>
          </span>
        </div>
      </div>
      <div className="chart-toolbar">
        <div className="segmented" role="group" aria-label="Chart timeframe">
          {TIMEFRAMES.map((item) => (
            <button
              key={item.value}
              className={timeframe === item.value ? "active" : ""}
              aria-pressed={timeframe === item.value}
              onClick={() => setTimeframe(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="segmented chart-style"
          role="group"
          aria-label="Chart style"
        >
          <button
            className={variant === "candles" ? "active" : ""}
            aria-label="Candlestick chart"
            aria-pressed={variant === "candles"}
            onClick={() => setVariant("candles")}
          >
            <Icon name="candle" size={16} />
          </button>
          <button
            className={variant === "area" ? "active" : ""}
            aria-label="Area chart"
            aria-pressed={variant === "area"}
            onClick={() => setVariant("area")}
          >
            <Icon name="chart" size={16} />
          </button>
        </div>
      </div>
      <div className="chart-content" aria-busy={isLoading}>
        {isLoading ? (
          <div
            className="skeleton chart-skeleton"
            role="status"
            aria-label="Loading price data"
          />
        ) : error && !data ? (
          <DataState
            error
            title="Chart data unavailable"
            description={error.message}
            onRetry={() => {
              void mutate();
            }}
            busy={isValidating}
          />
        ) : !data?.candles.length ? (
          <DataState
            title="No price history"
            description="There are no candles for this asset and timeframe."
            onRetry={() => {
              void mutate();
            }}
            busy={isValidating}
          />
        ) : (
          <>
            {error && (
              <div className="stale-notice" role="status">
                Chart refresh failed. Showing the last successful response.{" "}
                <button
                  onClick={() => {
                    void mutate();
                  }}
                  disabled={isValidating}
                >
                  Retry
                </button>
              </div>
            )}
            <figure>
              <figcaption className="sr-only">
                {asset.name} {period} price chart.{" "}
                {stats &&
                  `Range ${formatUsd(stats.low)} to ${formatUsd(stats.high)}, change ${formatPercent(stats.change)}.`}{" "}
                The same data is available in the price history table below.
              </figcaption>
              <PriceChart candles={data.candles} variant={variant} />
            </figure>
          </>
        )}
      </div>
      <dl className="chart-stats">
        <div>
          <dt>{period} high</dt>
          <dd>{stats ? formatUsd(stats.high) : "—"}</dd>
        </div>
        <div>
          <dt>{period} low</dt>
          <dd>{stats ? formatUsd(stats.low) : "—"}</dd>
        </div>
        <div>
          <dt>
            {period} volume ({asset.ticker})
          </dt>
          <dd>{stats ? formatCompactNumber(stats.volume) : "—"}</dd>
        </div>
        <div>
          <dt>{period} change</dt>
          <dd className={stats && stats.change < 0 ? "negative" : "positive"}>
            {stats ? formatPercent(stats.change) : "—"}
          </dd>
        </div>
      </dl>
      <div className="chart-data-toggle">
        <button
          aria-expanded={showData}
          aria-controls="price-history"
          onClick={() => setShowData(!showData)}
          disabled={!data?.candles.length}
        >
          {showData ? "Hide" : "View"} accessible price history
          <Icon name="chevron" size={14} />
        </button>
        <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">
          Charts by TradingView
        </a>
      </div>
      {showData && data && (
        <div
          id="price-history"
          className="table-scroll history-table"
          role="region"
          aria-label="Price history"
          tabIndex={0}
        >
          <table>
            <caption>
              Full {period} price history · UTC · prices in {quoteCurrency}
            </caption>
            <thead>
              <tr>
                {[
                  "Time",
                  "Open",
                  "High",
                  "Low",
                  "Close",
                  `Volume (${asset.ticker})`,
                ].map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.candles.map((candle) => (
                <tr key={candle.time}>
                  <th scope="row">
                    {new Date(candle.time * 1000)
                      .toISOString()
                      .replace("T", " ")
                      .slice(0, 16)}
                  </th>
                  <td>{formatUsd(candle.open)}</td>
                  <td>{formatUsd(candle.high)}</td>
                  <td>{formatUsd(candle.low)}</td>
                  <td>{formatUsd(candle.close)}</td>
                  <td>{formatCompactNumber(candle.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
