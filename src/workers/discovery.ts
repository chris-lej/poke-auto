import type { AppConfig } from "../config/loadConfig.js";
import type { ProductRepository } from "../db/repository.js";
import type { BrowserService } from "../browser/index.js";
import type { Logger } from "../util/index.js";
import { errorMessage } from "../util/index.js";

/**
 * Discovery is **off** unless `DISCOVERY_ENABLED` is true and seed URLs are set in config.
 * When disabled, do not call `runDiscoveryPass` (this module performs no I/O unless invoked).
 *
 * Heuristic: absolute links on `*.pokemoncenter.com` whose path looks like a product page:
 * contains `/product/`, or has a `/p/<segment>/` style segment (common on US listings).
 */
export function isPokemonCenterProductUrl(urlString: string): boolean {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (!host.endsWith("pokemoncenter.com")) return false;
  const path = u.pathname.toLowerCase();
  if (path.includes("/product/")) return true;
  const segs = path.split("/").filter(Boolean);
  const pIdx = segs.indexOf("p");
  return pIdx >= 0 && pIdx < segs.length - 1;
}

/**
 * Collects `a[href]` targets from a loaded page, resolves relative URLs, filters product links, dedupes.
 */
export async function collectProductLinksFromPage(
  page: import("playwright").Page,
): Promise<string[]> {
  const base = page.url();
  const hrefs = await page.evaluate((documentBase) => {
    const seen = new Set<string>();
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
      try {
        const abs = new URL(href, documentBase).href;
        seen.add(abs.split("#")[0] ?? abs);
      } catch {
        /* skip */
      }
    }
    return [...seen];
  }, base);

  const productUrls = [...new Set(hrefs.filter(isPokemonCenterProductUrl))];
  return productUrls;
}

export type DiscoveryResult = {
  seedsVisited: number;
  urlsUpserted: number;
  uniqueProductUrlsFound: number;
};

/**
 * Visits each discovery seed URL, extracts product links, upserts into `products`.
 * No Telegram. Per-seed failures are logged; other seeds continue.
 */
export async function runDiscoveryPass(input: {
  repo: ProductRepository;
  browser: BrowserService;
  config: AppConfig;
  log: Logger;
}): Promise<DiscoveryResult> {
  const { repo, browser, config, log } = input;

  if (!config.discoveryEnabled) {
    return { seedsVisited: 0, urlsUpserted: 0, uniqueProductUrlsFound: 0 };
  }

  let seedsVisited = 0;
  const allFound = new Set<string>();

  for (const seedUrl of config.discoverySeedUrls) {
    try {
      const foundForSeed = await browser.withPage(async (page) => {
        await page.goto(seedUrl, { waitUntil: "domcontentloaded" });
        return collectProductLinksFromPage(page);
      });
      seedsVisited++;
      for (const u of foundForSeed) allFound.add(u);
      log.info("discovery seed scraped", {
        seed: seedUrl,
        productLinksOnPage: foundForSeed.length,
      });
    } catch (e) {
      log.error(`discovery failed for seed ${seedUrl}: ${errorMessage(e)}`);
    }
  }

  let urlsUpserted = 0;
  for (const url of allFound) {
    repo.upsertProductByUrl(url, null);
    urlsUpserted++;
  }

  log.info("discovery pass complete", {
    seedsVisited,
    uniqueProductUrlsFound: allFound.size,
    urlsUpserted,
  });

  return {
    seedsVisited,
    urlsUpserted,
    uniqueProductUrlsFound: allFound.size,
  };
}
