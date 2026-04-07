import type { AppConfig } from "../config/loadConfig.js";
import type { Logger } from "./logger.js";
import { withRetry, type RetryOptions } from "./retry.js";
import { errorMessage } from "./errors.js";

/** Bounded backoff for Playwright navigation and Telegram HTTP (T18). */
export function retryOptionsFromConfig(
  config: AppConfig,
  log: Logger,
  label: string,
): RetryOptions {
  return {
    maxAttempts: config.retryMaxAttempts,
    baseDelayMs: config.retryBaseDelayMs,
    exponential: config.retryExponential,
    onRetry: ({ attempt, maxAttempts, delayMs, error }) => {
      log.warn(`${label}: retry ${attempt}/${maxAttempts} after ${delayMs}ms — ${errorMessage(error)}`);
    },
  };
}

export async function withConfiguredRetry<T>(
  config: AppConfig,
  log: Logger,
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  return withRetry(fn, retryOptionsFromConfig(config, log, label));
}
