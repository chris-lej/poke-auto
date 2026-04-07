import { sleep } from "./sleep.js";

export type RetryOptions = {
  maxAttempts: number;
  /** Delay before attempt 2+ (ms). */
  baseDelayMs: number;
  /** If true, delay doubles each retry after the first failure. */
  exponential?: boolean;
};

/**
 * Runs `fn` until it succeeds or `maxAttempts` is exhausted. Rethrows the last error.
 * T18 may extend backoff policy; keep options explicit here.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxAttempts, baseDelayMs, exponential = false } = options;
  let lastErr: unknown;
  let delay = baseDelayMs;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts) break;
      await sleep(delay);
      if (exponential) delay *= 2;
    }
  }
  throw lastErr;
}
