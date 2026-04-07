import { sleep } from "./sleep.js";

export type RetryOptions = {
  maxAttempts: number;
  /** Wait after attempt 1 fails before attempt 2, then after each further failure (ms). */
  baseDelayMs: number;
  /** If true, delay doubles after each failure (e.g. 1s → 2s → 4s). */
  exponential?: boolean;
  /** Called before sleeping for the next attempt (not called after final failure). */
  onRetry?: (info: { attempt: number; maxAttempts: number; delayMs: number; error: unknown }) => void;
  /** If false, do not retry — rethrow immediately (still counts as an attempt). */
  shouldRetry?: (error: unknown) => boolean;
};

/**
 * Runs `fn` until it succeeds or `maxAttempts` is exhausted. Rethrows the last error.
 * Policy: first attempt immediately; on failure wait `baseDelayMs` (×2 each time if exponential), then retry.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxAttempts, baseDelayMs, exponential = false, onRetry, shouldRetry } = options;
  const canRetry = shouldRetry ?? (() => true);
  let lastErr: unknown;
  let delay = baseDelayMs;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts) break;
      if (!canRetry(e)) throw e;
      onRetry?.({ attempt, maxAttempts, delayMs: delay, error: e });
      await sleep(delay);
      if (exponential) delay *= 2;
    }
  }
  throw lastErr;
}
