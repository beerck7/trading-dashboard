import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  test(`dashboard fits ${width}px with an accessible, complete chart`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Select Bitcoin" })).toBeVisible();
    await expect(page.locator(".price-chart canvas").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const chart = await page.locator(".price-chart").boundingBox();
    expect(chart!.x).toBeGreaterThanOrEqual(0);
    expect(chart!.x + chart!.width).toBeLessThanOrEqual(width);
    await expect(page.getByRole("region", { name: /Market overview table/ })).toBeVisible();
    expect(errors).toEqual([]);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("asset, timeframe and chart style update the dataset; history is keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select Ethereum" }).click();
  await expect(page.getByRole("heading", { name: "Ethereum ETH / USD" })).toBeVisible();
  await page.getByRole("button", { name: "1W", exact: true }).click();
  await page.getByRole("button", { name: "View accessible price history" }).click();
  await expect(page.locator("#price-history tbody tr")).toHaveCount(168);
  await page.getByRole("button", { name: "Area chart", exact: true }).click();
  await expect(page.getByRole("button", { name: "Area chart", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Filter market events").selectOption("volume");
  await expect(page.locator(".event-list .event")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search assets" }).fill("nothing matches");
  await expect(page.getByRole("heading", { name: "No matching assets" })).toBeVisible();
});

test("watchlist saves across reload and supports an empty state", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Remove Bitcoin from watchlist" }).click();
  await page.getByRole("button", { name: "Remove Ethereum from watchlist" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Watchlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your watchlist is empty" })).toBeVisible();
  await page.getByRole("button", { name: "Back to overview" }).click();
  await page.getByRole("button", { name: "Add Solana to watchlist" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Remove Solana from watchlist" })).toBeVisible();
});

test("mobile menu supports keyboard dismissal and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Watchlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your watchlist." })).toBeVisible();
});

test("market failure offers retry and recovers", async ({ page }) => {
  let fail = true;
  await page.route("**/api/markets", async (route) => fail ? route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' }) : route.continue());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Markets are temporarily unavailable" })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Select Bitcoin" })).toBeVisible();
});

test("market, events and chart empty responses render useful states", async ({ page }) => {
  await page.route("**/api/markets", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, events: [] } });
  });
  await page.route("**/api/candles?**", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, candles: [] } });
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "No price history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No events yet" })).toBeVisible();
  await page.route("**/api/markets", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, assets: [], events: [] } });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "No market data available" })).toBeVisible();
});

test("malformed API response is rejected before reaching the chart", async ({ page }) => {
  await page.route("**/api/candles?**", (route) => route.fulfill({ json: { candles: [{ close: "broken" }] } }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Chart data unavailable" })).toBeVisible();
});

test("REST routes reject invalid parameters without calling upstream", async ({ request }) => {
  expect((await request.get("/api/candles?symbol=INVALID")).status()).toBe(400);
  expect((await request.get("/api/candles?timeframe=INVALID")).status()).toBe(400);
  const markets = await request.get("/api/markets");
  expect(markets.status()).toBe(200);
  expect((await markets.json()).mode).toBe("demo");
});

test("loading disables refresh, then a failed refresh retains the previous snapshot", async ({ page }) => {
  let release: (() => void) | undefined;
  let failed = false;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/markets", async (route) => {
    await gate;
    if (failed) await route.fulfill({ status: 503, json: { error: "unavailable" } });
    else await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("status", { name: "Loading market data" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh market data" })).toBeDisabled();
  release!();
  await expect(page.getByRole("button", { name: "Select Bitcoin" })).toBeVisible();
  failed = true;
  await page.getByRole("button", { name: "Refresh market data" }).click();
  await expect(page.getByText("Refresh failed. Showing the last successful snapshot.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Bitcoin" })).toBeVisible();
});

test("keyboard skip link reaches content and reduced motion disables animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("section navigation returns from watchlist to overview and focuses its target", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Watchlist", exact: true }).click();
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await expect(page.locator("#analytics")).toBeFocused();
  await page.getByRole("button", { name: "Watchlist", exact: true }).click();
  await page.getByRole("link", { name: "Market events", exact: true }).click();
  await expect(page.locator("#events")).toBeFocused();
});

test("live data shows its source, quote currency and changing update time", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let refreshed = false;
  await page.route("**/api/markets", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, mode: "live", asOf: refreshed ? "2026-10-05T12:35:56Z" : "2026-10-05T12:34:56Z" } });
  });
  await page.route("**/api/candles?**", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ json: { ...body, mode: "live" } });
  });
  await page.goto("/");
  await expect(page.getByText("LIVE DATA", { exact: true })).toBeVisible();
  await expect(page.locator(".snapshot-label")).toContainText("12:34:56 UTC");
  await expect(page.getByRole("heading", { name: "Bitcoin BTC / USDT" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  refreshed = true;
  await page.getByRole("button", { name: "Refresh market data" }).click();
  await expect(page.locator(".snapshot-label")).toContainText("12:35:56 UTC");
});
