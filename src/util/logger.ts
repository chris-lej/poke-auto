import type { LogLevel } from "../config/loadConfig.js";
import { getConfig } from "../config/index.js";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function formatLine(level: string, msg: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const metaStr =
    meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${ts} [${level}] ${msg}${metaStr}`;
}

/**
 * Redacts Telegram bot token substrings and common `bot<token>` patterns.
 */
export function redactSecrets(message: string, botToken?: string): string {
  let out = message;
  if (botToken && botToken.length > 4) {
    out = out.split(botToken).join("[REDACTED]");
  }
  out = out.replace(/bot\d+:[A-Za-z0-9_-]{15,}/gi, "[REDACTED]");
  return out;
}

export type Logger = {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
};

export function createLogger(minLevel: LogLevel, botToken?: string): Logger {
  const threshold = LEVEL_ORDER[minLevel];

  function log(
    level: LogLevel,
    label: string,
    msg: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LEVEL_ORDER[level] < threshold) return;
    const safeMsg = redactSecrets(msg, botToken);
    const safeMeta = meta ? redactMeta(meta, botToken) : undefined;
    const line = formatLine(label, safeMsg, safeMeta);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  return {
    debug: (msg, meta) => log("debug", "DEBUG", msg, meta),
    info: (msg, meta) => log("info", "INFO", msg, meta),
    warn: (msg, meta) => log("warn", "WARN", msg, meta),
    error: (msg, meta) => log("error", "ERROR", msg, meta),
  };
}

function redactMeta(meta: Record<string, unknown>, botToken?: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof v === "string") out[k] = redactSecrets(v, botToken);
    else out[k] = v;
  }
  return out;
}

let singleton: Logger | undefined;

/** Logger using `getConfig().logLevel` and token redaction; config must be loaded first. */
export function getLogger(): Logger {
  if (!singleton) {
    const c = getConfig();
    singleton = createLogger(c.logLevel, c.telegramBotToken || undefined);
  }
  return singleton;
}
