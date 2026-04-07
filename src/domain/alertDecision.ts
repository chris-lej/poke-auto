import type { NormalizedStockStatus } from "./stockStatus.js";
import type { PageEvaluation } from "./pageEvaluation.js";

export type AlertDecision = {
  shouldAlert: boolean;
  reason: string;
};

/**
 * Alerts only when the page is classified as **in_stock** and we are not repeating
 * a stable in_stock observation.
 *
 * Transitions that **do** alert: first observation (no prior) with in_stock;
 * `out_of_stock` | `unknown` | `blocked` → `in_stock`.
 *
 * Does **not** alert: `in_stock` → `in_stock` (including hash-only flips while status stays in_stock — worker skips new snapshot in that case).
 *
 * Optional debounce: if `lastAlertedAt` is within `debounceSeconds`, suppress repeat in_stock alerts
 * (guards flip-flop out→in→out→in within a short window).
 */
export function decideAlert(input: {
  previousStatus: NormalizedStockStatus | null;
  evaluation: PageEvaluation;
  lastAlertedAt: Date | null;
  debounceSeconds: number;
}): AlertDecision {
  const { previousStatus, evaluation, lastAlertedAt, debounceSeconds } = input;

  if (evaluation.status !== "in_stock") {
    return { shouldAlert: false, reason: "not_in_stock" };
  }

  if (previousStatus === "in_stock") {
    return { shouldAlert: false, reason: "already_in_stock" };
  }

  if (
    previousStatus !== null &&
    previousStatus !== "out_of_stock" &&
    previousStatus !== "unknown" &&
    previousStatus !== "blocked"
  ) {
    return { shouldAlert: false, reason: "unexpected_prior_state" };
  }

  if (
    debounceSeconds > 0 &&
    lastAlertedAt !== null &&
    Date.now() - lastAlertedAt.getTime() < debounceSeconds * 1000
  ) {
    return { shouldAlert: false, reason: "debounced_after_recent_alert" };
  }

  if (previousStatus === null) {
    return { shouldAlert: true, reason: "first_observation_in_stock" };
  }

  return {
    shouldAlert: true,
    reason: `transition_${previousStatus}_to_in_stock`,
  };
}
