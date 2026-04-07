/**
 * Smoke-send one Telegram message using the same config as the app.
 * Usage (after build): `node --env-file=.env dist/scripts/telegramTest.js`
 * Do not commit real tokens; `.env` must stay gitignored.
 */

import { loadConfig } from "../config/index.js";
import { createTelegramNotifier } from "../notifications/index.js";
import { createLogger } from "../util/index.js";

const config = loadConfig();
const log = createLogger(config.logLevel, config.telegramBotToken || undefined);
const telegram = createTelegramNotifier(config, log);
await telegram.sendAlert({
  text: "poke-auto: Telegram test message (ok to delete)",
});
