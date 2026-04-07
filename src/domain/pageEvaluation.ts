import type { NormalizedStockStatus } from "./stockStatus.js";

/**
 * Result of evaluating one product page in the browser layer.
 */
export type PageEvaluation = {
  status: NormalizedStockStatus;
  /** Short machine-oriented code, e.g. "add_to_cart_visible". */
  reason: string;
  /** Fingerprint of canonical page snippet or HTML (implementation-specific). */
  pageHash: string;
  capturedAt: Date;
};
