import { Icon } from "./Icon";

export function DataState({
  title,
  description,
  onRetry,
  busy = false,
  error = false,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  busy?: boolean;
  error?: boolean;
}) {
  return (
    <div className="data-state" role={error ? "alert" : "status"}>
      <span className="state-icon">
        <Icon name={error ? "activity" : "search"} size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <button className="button secondary" onClick={onRetry} disabled={busy}>
          <Icon name="refresh" />
          {busy ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading market data"
      className="dashboard-skeleton"
    >
      <span className="sr-only">Loading market data</span>
      <div className="asset-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="panel skeleton-card" key={index}>
            <div className="skeleton h-5 w-24" />
            <div className="skeleton mt-7 h-8 w-36" />
            <div className="skeleton mt-3 h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="panel skeleton mt-6 h-[390px]" />
    </div>
  );
}
