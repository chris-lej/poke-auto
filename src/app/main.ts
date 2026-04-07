import { getConfig } from "../config/index.js";
import { createProductRepository, initDatabase } from "../db/index.js";
import { BrowserService } from "../browser/index.js";
import { createTelegramNotifier } from "../notifications/index.js";
import { runMonitorTick, seedProductsFromConfig } from "../workers/index.js";
import { createLogger, sleep } from "../util/index.js";

const config = getConfig();
const log = createLogger(config.logLevel, config.telegramBotToken || undefined);

const db = initDatabase(config.databasePath);
const repo = createProductRepository(db);
const browser = new BrowserService(config);
const telegram = config.dryRun ? null : createTelegramNotifier(config);

let shuttingDown = false;

async function tick(): Promise<void> {
  log.info("monitor tick start");
  await runMonitorTick({ repo, browser, config, log, telegram });
  log.info("monitor tick done");
}

async function mainLoop(): Promise<void> {
  seedProductsFromConfig(repo, config);
  log.info("products seeded from config", { count: config.productUrls.length });

  while (!shuttingDown) {
    const start = Date.now();
    try {
      await tick();
    } catch (e) {
      log.error(`tick failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (shuttingDown) break;
    const elapsed = Date.now() - start;
    let remaining = Math.max(0, config.pollIntervalSeconds * 1000 - elapsed);
    const chunk = 1000;
    while (remaining > 0 && !shuttingDown) {
      const step = Math.min(chunk, remaining);
      await sleep(step);
      remaining -= step;
    }
  }
}

function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info(`shutdown (${signal})`);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

try {
  log.info("poke-auto starting", {
    dryRun: config.dryRun,
    pollIntervalSeconds: config.pollIntervalSeconds,
    databasePath: config.databasePath,
  });
  await mainLoop();
} finally {
  await browser.close();
  db.close();
  log.info("poke-auto stopped");
}
