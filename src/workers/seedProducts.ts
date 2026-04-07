import type { AppConfig } from "../config/loadConfig.js";
import type { ProductRepository } from "../db/repository.js";

/**
 * Upserts every configured product URL. URLs removed from config are **not** deleted
 * from the database (avoids accidental data loss); stale rows simply stop receiving checks
 * if you also remove them from monitoring logic — today all DB products are polled.
 */
export function seedProductsFromConfig(
  repo: ProductRepository,
  config: AppConfig,
): { seeded: number } {
  let n = 0;
  for (const url of config.productUrls) {
    repo.upsertProductByUrl(url, null);
    n++;
  }
  return { seeded: n };
}
