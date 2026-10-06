"use client";

import { useState } from "react";
import { DataState } from "@/components/ui/DataState";
import { Icon } from "@/components/ui/Icon";
import type { AssetSymbol, MarketEvent } from "@/types/market";
import { formatClockTime } from "@/utils/formatters";

export function EventsPanel({
  events,
  symbol,
}: {
  events: MarketEvent[];
  symbol: AssetSymbol;
}) {
  const [filter, setFilter] = useState<"all" | MarketEvent["kind"]>("all");
  const filtered = events.filter(
    (event) =>
      event.symbol === symbol && (filter === "all" || event.kind === filter),
  );
  return (
    <section
      id="events"
      tabIndex={-1}
      className="panel events-panel"
      aria-labelledby="events-heading"
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RECENT OBSERVATIONS</span>
          <h2 id="events-heading">Market events</h2>
        </div>
        <Icon name="activity" />
      </div>
      <label className="event-filter">
        <span>Show</span>
        <select
          aria-label="Filter market events"
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
        >
          <option value="all">All observations</option>
          <option value="momentum">Momentum</option>
          <option value="volume">Volume</option>
          <option value="volatility">Volatility</option>
        </select>
      </label>
      <div className="event-list">
        {filtered.length ? (
          filtered.map((event) => (
            <article key={event.id} className="event">
              <div className={`event-dot ${event.kind}`}>
                <Icon
                  name={
                    event.kind === "momentum"
                      ? "chart"
                      : event.kind === "volume"
                        ? "pulse"
                        : "activity"
                  }
                  size={17}
                />
              </div>
              <div>
                <div className="event-meta">
                  <span>{event.kind}</span>
                  <time dateTime={new Date(event.timestamp).toISOString()}>
                    {formatClockTime(event.timestamp)} UTC
                  </time>
                </div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
              </div>
            </article>
          ))
        ) : (
          <DataState
            title="No events yet"
            description="Observations will appear when this asset has enough data."
          />
        )}
      </div>
      <p className="events-footnote">
        <Icon name="info" size={14} />
        Descriptive observations, not trade recommendations.
      </p>
    </section>
  );
}
