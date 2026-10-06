"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { Sidebar, type DashboardView } from "@/components/layout/Sidebar";
import { DashboardSkeleton, DataState } from "@/components/ui/DataState";
import { Icon } from "@/components/ui/Icon";
import { useMarkets } from "@/hooks/useMarketData";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { AssetSymbol } from "@/types/market";
import { formatSnapshot } from "@/utils/formatters";
import { AnalyticsCards } from "./AnalyticsCards";
import { AssetCards } from "./AssetCards";
import { ChartPanel } from "./ChartPanel";
import { EventsPanel } from "./EventsPanel";
import { MarketTable } from "./MarketTable";

export function Dashboard() {
  const [view, setView] = useState<DashboardView>("overview");
  const [selected, setSelected] = useState<AssetSymbol>("BTCUSDT");
  const [query, setQuery] = useState("");
  const { watchlist, toggle } = useWatchlist();
  const { data, error, isLoading, isValidating, mutate } = useMarkets();
  const { mutate: refreshCache } = useSWRConfig();
  const refresh = () => { void refreshCache((key) => typeof key === "string" && key.startsWith("/api/")); };
  const asset = data?.assets.find((item) => item.symbol === selected) ?? data?.assets[0];
  const changeView = (next: DashboardView) => { setView(next); setQuery(""); };
  const selectAsset = (symbol: AssetSymbol) => { setSelected(symbol); if (view === "watchlist") changeView("overview"); };
  const visibleAssets = data?.assets.filter((item) => view !== "watchlist" || watchlist.includes(item.symbol)) ?? [];

  return <div className="app-shell"><Sidebar view={view} onViewChange={changeView} />
    <div className="workspace"><header className="topbar"><div className="breadcrumb">Workspace <Icon name="chevron" size={13} /><span>{view === "overview" ? "Overview" : "Watchlist"}</span></div>
      <div className="topbar-right"><span className={`api-status ${error ? "offline" : ""}`} role="status"><span />{error ? "API unavailable" : isLoading ? "Connecting" : "API connected"}</span><span className="topbar-divider" /><span className="avatar small-avatar">NB</span></div>
    </header>
    <main id="main-content" tabIndex={-1}>
      <div className="page-heading"><div><div className="eyebrow">YOUR MARKET, AT A GLANCE</div><h1>{view === "overview" ? "Market overview" : "Your watchlist"}<span className="heading-dot">.</span></h1><p>Less noise. More perspective. Explore what’s moving.</p></div>
        <button className="button secondary refresh-button" onClick={refresh} disabled={isValidating} aria-label="Refresh market data"><Icon name="refresh" className={isValidating ? "refreshing" : ""} />{isValidating ? "Refreshing…" : "Refresh data"}</button>
      </div>
      <div className="demo-banner"><div><span className="demo-pill">{data ? data.mode === "live" ? "LIVE DATA" : "DEMO MODE" : "CONNECTING"}</span><span>{data?.mode === "demo" ? "Illustrative market data. Explore the full experience, no API keys needed." : "Binance Spot · Quotes in USDT · Updates every 60 seconds."}</span></div><span className="snapshot-label">{data ? `${data.mode === "demo" ? "Snapshot" : "Updated"} · ${formatSnapshot(data.asOf, data.mode === "live")}` : "Loading snapshot…"}</span></div>
      {isLoading ? <DashboardSkeleton /> : error && !data ? <section className="panel"><DataState error title="Markets are temporarily unavailable" description={error.message} onRetry={() => { void mutate(); }} busy={isValidating} /></section> : !data?.assets.length ? <section className="panel"><DataState title="No market data available" description="The service has not returned any assets yet." onRetry={() => { void mutate(); }} busy={isValidating} /></section> : <>
        {error && <div className="stale-notice" role="status">Refresh failed. Showing the last successful snapshot. Use Refresh data to retry.</div>}
        {visibleAssets.length > 0 && <AssetCards assets={visibleAssets} selected={asset!.symbol} onSelect={selectAsset} quoteCurrency={data.mode === "live" ? "USDT" : "USD"} />}
        {view === "overview" && asset && <><div className="main-grid"><ChartPanel asset={asset} quoteCurrency={data.mode === "live" ? "USDT" : "USD"} /><EventsPanel events={data.events} symbol={asset.symbol} /></div><AnalyticsCards symbol={asset.symbol} /></>}
        <MarketTable assets={data.assets} selected={asset!.symbol} watchlist={watchlist} query={query} onQueryChange={setQuery} onSelect={selectAsset} onToggleWatchlist={toggle} watchlistView={view === "watchlist"} />
        {view === "watchlist" && <button className="button secondary back-overview" onClick={() => changeView("overview")}>Back to overview<Icon name="chevron" size={14} /></button>}
      </>}
      <footer className="page-footer"><span><span className="footer-dot" />Made for the curious.</span><span>Market data and charts <span className="muted">/</span> Analytical use only</span></footer>
    </main></div>
  </div>;
}
