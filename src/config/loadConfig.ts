/**
 * Single entry for environment configuration. Application code should import
 * `loadConfig` / `getConfig` from this module only — not `process.env` elsewhere.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type AppConfig = {
  /** When true, Telegram and product URL requirements are relaxed for local/tooling runs. */
  dryRun: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  productUrls: string[];
  databasePath: string;
  pollIntervalSeconds: number;
  discoveryEnabled: boolean;
  discoverySeedUrls: string[];
  playwrightHeaded: boolean;
  logLevel: LogLevel;
};

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined || raw.trim() === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function parseCommaSeparatedList(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parsePositiveInt(raw: string | undefined, name: string, defaultValue: number): number {
  if (raw === undefined || raw.trim() === "") return defaultValue;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid ${name}: expected positive integer, got "${raw}"`);
  }
  return n;
}

function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

const LOG_LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

function parseLogLevel(raw: string | undefined, defaultLevel: LogLevel): LogLevel {
  if (raw === undefined || raw.trim() === "") return defaultLevel;
  const v = raw.trim().toLowerCase() as LogLevel;
  if (!LOG_LEVELS.includes(v)) {
    throw new Error(
      `Invalid LOG_LEVEL: expected one of ${LOG_LEVELS.join(", ")}, got "${raw}"`,
    );
  }
  return v;
}

/**
 * Loads and validates configuration from the environment.
 * @throws Error with a clear message when validation fails.
 */
export function loadConfig(): AppConfig {
  const dryRun = parseBool(process.env.DRY_RUN, false);

  const databasePath =
    process.env.DATABASE_PATH?.trim() || "./data/restock.db";
  const pollIntervalSeconds = parsePositiveInt(
    process.env.POLL_INTERVAL_SECONDS,
    "POLL_INTERVAL_SECONDS",
    300,
  );
  const discoveryEnabled = parseBool(process.env.DISCOVERY_ENABLED, false);
  const playwrightHeaded = parseBool(process.env.PLAYWRIGHT_HEADED, false);
  const logLevel = parseLogLevel(process.env.LOG_LEVEL, "info");

  const productUrls = parseCommaSeparatedList(process.env.PRODUCT_URLS);
  const discoverySeedUrls = parseCommaSeparatedList(process.env.DISCOVERY_SEED_URLS);

  let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  let telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";

  if (!dryRun) {
    telegramBotToken = requireEnv("TELEGRAM_BOT_TOKEN", process.env.TELEGRAM_BOT_TOKEN);
    telegramChatId = requireEnv("TELEGRAM_CHAT_ID", process.env.TELEGRAM_CHAT_ID);
    if (productUrls.length === 0) {
      throw new Error(
        "PRODUCT_URLS must list at least one URL (comma-separated), or set DRY_RUN=true for tooling-only runs",
      );
    }
  }

  if (discoveryEnabled && discoverySeedUrls.length === 0) {
    throw new Error(
      "DISCOVERY_ENABLED is true but DISCOVERY_SEED_URLS is empty — add seed URLs or disable discovery",
    );
  }

  return {
    dryRun,
    telegramBotToken,
    telegramChatId,
    productUrls,
    databasePath,
    pollIntervalSeconds,
    discoveryEnabled,
    discoverySeedUrls,
    playwrightHeaded,
    logLevel,
  };
}

let cached: AppConfig | undefined;

/** Cached singleton for app bootstrap; throws on first call if env is invalid. */
export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
