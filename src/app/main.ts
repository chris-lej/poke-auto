import { getConfig } from "../config/index.js";
import { createProductRepository, initDatabase } from "../db/index.js";
import { getLogger } from "../util/index.js";

const config = getConfig();
const log = getLogger();
const db = initDatabase(config.databasePath);

try {
  if (config.dryRun) {
    log.info("dry run — Telegram and product URL requirements skipped");
  } else {
    log.info("monitor config loaded", {
      productCount: config.productUrls.length,
      pollIntervalSeconds: config.pollIntervalSeconds,
    });
  }
  const repo = createProductRepository(db);
  const products = repo.getAllProducts();
  log.info("database ready", { productRows: products.length });
} finally {
  db.close();
}
// Monitor loop and graceful shutdown land in T16.
