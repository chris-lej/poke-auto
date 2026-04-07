/**
 * Smoke-send one Telegram message using the same config as the app.
 * Usage (after build): `node --env-file=.env dist/scripts/telegramTest.js`
 * Do not commit real tokens; `.env` must stay gitignored.
 */

import { loadConfig } from "../config/index.js";
import { createTelegramNotifier } from "../notifications/index.js";

const config = loadConfig();
const telegram = createTelegramNotifier(config);
await telegram.sendAlert({
  text: "poke-auto: Telegram test message (ok to delete)",
});
