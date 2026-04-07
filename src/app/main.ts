import { loadConfig } from "../config/index.js";
import { createProductRepository, initDatabase } from "../db/index.js";

const config = loadConfig();
const db = initDatabase(config.databasePath);

try {
  if (config.dryRun) {
    console.log("poke-auto: dry run — Telegram and product URL requirements skipped");
  } else {
    console.log(
      `poke-auto: ${config.productUrls.length} product URL(s), poll every ${config.pollIntervalSeconds}s`,
    );
  }
  const repo = createProductRepository(db);
  const products = repo.getAllProducts();
  console.log(`poke-auto: database OK (${products.length} product row(s))`);
} finally {
  db.close();
}
// Monitor loop and graceful shutdown land in T16.
