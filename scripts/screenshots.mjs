import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

await mkdir("docs/images", { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [["desktop", 1440, 1100], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    await page.goto(process.argv[2] ?? "http://127.0.0.1:3000");
    await page.locator(".price-chart canvas").first().waitFor({ state: "visible" });
    await page.screenshot({ path: `docs/images/${name}.png`, fullPage: true });
    await page.close();
    console.log(`Saved docs/images/${name}.png`);
  }
} finally { await browser.close(); }
