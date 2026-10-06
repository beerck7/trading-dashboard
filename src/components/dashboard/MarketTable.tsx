import { AssetBadge } from "@/components/ui/AssetBadge";
import { DataState } from "@/components/ui/DataState";
import { Icon } from "@/components/ui/Icon";
import { Sparkline } from "@/components/ui/Sparkline";
import type { Asset, AssetSymbol } from "@/types/market";
import {
  formatCompactNumber,
  formatPercent,
  formatUsd,
} from "@/utils/formatters";

export function MarketTable({
  assets,
  selected,
  watchlist,
  query,
  onQueryChange,
  onSelect,
  onToggleWatchlist,
  watchlistView,
}: {
  assets: Asset[];
  selected: AssetSymbol;
  watchlist: AssetSymbol[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (symbol: AssetSymbol) => void;
  onToggleWatchlist: (symbol: AssetSymbol) => void;
  watchlistView: boolean;
}) {
  const filtered = assets.filter(
    (asset) =>
      (!watchlistView || watchlist.includes(asset.symbol)) &&
      `${asset.name} ${asset.ticker}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="panel market-panel" aria-labelledby="market-heading">
      <div className="panel-heading">
        <div>
          <h2 id="market-heading">
            {watchlistView ? "Your watchlist" : "Market overview"}
          </h2>
          <p>
            {watchlistView
              ? "Assets saved to your watchlist."
              : "Prices, daily changes and trading volume."}
          </p>
        </div>
        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="sr-only">Search assets</span>
          <input
            type="search"
            placeholder="Search assets…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
      </div>
      {filtered.length > 0 && (
        <p className="table-scroll-hint">
          Swipe or scroll to explore all columns →
        </p>
      )}
      {!filtered.length ? (
        <DataState
          title={query ? "No matching assets" : "Your watchlist is empty"}
          description={
            query
              ? "Try another asset name or symbol."
              : "Open Overview and use the star buttons to save an asset."
          }
        />
      ) : (
        <div
          className="table-scroll"
          role="region"
          aria-label="Market overview table, scroll horizontally for more columns"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">
              Asset prices and 24-hour changes. Select an asset to update its
              chart.
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Watchlist</span>
                </th>
                <th scope="col">Asset</th>
                <th scope="col">Price</th>
                <th scope="col">24h change</th>
                <th scope="col">24h volume</th>
                <th scope="col">Price trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr
                  key={asset.symbol}
                  className={asset.symbol === selected ? "selected-row" : ""}
                >
                  <td>
                    <button
                      className={`icon-button star-button ${watchlist.includes(asset.symbol) ? "saved" : ""}`}
                      aria-label={`${watchlist.includes(asset.symbol) ? "Remove" : "Add"} ${asset.name} ${watchlist.includes(asset.symbol) ? "from" : "to"} watchlist`}
                      aria-pressed={watchlist.includes(asset.symbol)}
                      onClick={() => onToggleWatchlist(asset.symbol)}
                    >
                      <Icon name="star" size={16} />
                    </button>
                  </td>
                  <th scope="row">
                    <button
                      className="table-asset"
                      onClick={() => onSelect(asset.symbol)}
                      aria-label={`View ${asset.name} chart`}
                    >
                      <AssetBadge symbol={asset.symbol} small />
                      <span>
                        <strong>{asset.name}</strong>
                        <span>{asset.ticker}</span>
                      </span>
                    </button>
                  </th>
                  <td className="numeric">{formatUsd(asset.price)}</td>
                  <td
                    className={`numeric ${asset.change24h >= 0 ? "positive" : "negative"}`}
                  >
                    {formatPercent(asset.change24h)}
                  </td>
                  <td className="numeric">
                    ${formatCompactNumber(asset.volume24h)}
                  </td>
                  <td>
                    <Sparkline
                      data={asset.sparkline}
                      positive={asset.change24h >= 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
