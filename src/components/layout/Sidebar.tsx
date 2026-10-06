"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type DashboardView = "overview" | "watchlist";

export function Sidebar({
  view,
  onViewChange,
}: {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (open)
      mobileNavRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const select = (next: DashboardView) => {
    onViewChange(next);
    if (open) {
      setOpen(false);
      menuRef.current?.focus();
    }
  };
  const goToSection = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    onViewChange("overview");
    setOpen(false);
    requestAnimationFrame(() => {
      const section = document.getElementById(id);
      section?.focus({ preventScroll: true });
      section?.scrollIntoView();
    });
  };
  const links = (
    <>
      <span className="nav-label">WORKSPACE</span>
      <button
        className={`nav-item ${view === "overview" ? "active" : ""}`}
        aria-current={view === "overview" ? "page" : undefined}
        onClick={() => select("overview")}
      >
        <Icon name="grid" />
        Overview
      </button>
      <button
        className={`nav-item ${view === "watchlist" ? "active" : ""}`}
        aria-current={view === "watchlist" ? "page" : undefined}
        onClick={() => select("watchlist")}
      >
        <Icon name="star" />
        Watchlist
      </button>
      <a
        className="nav-item"
        href="#analytics"
        onClick={(event) => goToSection(event, "analytics")}
      >
        <Icon name="chart" />
        Analytics
      </a>
      <a
        className="nav-item"
        href="#events"
        onClick={(event) => goToSection(event, "events")}
      >
        <Icon name="activity" />
        Market events
      </a>
    </>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Signal home">
          <span className="brand-mark">
            <Icon name="pulse" size={23} />
          </span>
          signal<span className="brand-dot">.</span>
        </Link>
        <nav aria-label="Main navigation">{links}</nav>
        <div className="sidebar-bottom">
          <div className="project-note">
            <Icon name="info" />
            <strong>About this dashboard</strong>
            <p>Public market data with charts and a saved watchlist.</p>
            <a
              href="https://github.com/beerck7/trading-dashboard"
              target="_blank"
              rel="noreferrer"
            >
              View source <Icon name="external" size={14} />
            </a>
          </div>
          <div className="profile">
            <div>
              <strong>No account required</strong>
              <span>Watchlist saved locally</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="mobile-header">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Icon name="pulse" />
          </span>
          signal<span className="brand-dot">.</span>
        </Link>
        <button
          className="icon-button"
          ref={menuRef}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          ref={mobileNavRef}
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {links}
        </nav>
      )}
    </>
  );
}
