import { loadConfig } from "../config/index.js";

const config = loadConfig();
// Minimal bootstrap until T16 wires the monitor loop.
if (config.dryRun) {
  console.log("poke-auto: dry run — Telegram and product URL requirements skipped");
} else {
  console.log(
    `poke-auto: ${config.productUrls.length} product URL(s), poll every ${config.pollIntervalSeconds}s`,
  );
}
