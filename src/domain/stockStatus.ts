/**
 * Normalized availability for a product URL (no SKU granularity in MVP).
 *
 * - in_stock: page signals add-to-cart / available to purchase.
 * - out_of_stock: explicit sold-out / unavailable messaging.
 * - unknown: conflicting or missing signals; treat conservatively for alerts.
 * - blocked: access prevented (e.g. interstitial, unexpected gate) — not CAPTCHA bypass territory.
 */
export type NormalizedStockStatus =
  | "in_stock"
  | "out_of_stock"
  | "unknown"
  | "blocked";

export const NORMALIZED_STOCK_STATUSES: readonly NormalizedStockStatus[] = [
  "in_stock",
  "out_of_stock",
  "unknown",
  "blocked",
] as const;

export function isNormalizedStockStatus(s: string): s is NormalizedStockStatus {
  return (NORMALIZED_STOCK_STATUSES as readonly string[]).includes(s);
}
