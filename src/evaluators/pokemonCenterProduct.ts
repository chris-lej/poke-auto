import { createHash } from "node:crypto";
import type { Page } from "playwright";
import type { PageEvaluation } from "../domain/index.js";

/**
 * We hash a trimmed text window around commerce cues instead of full HTML to reduce
 * noise from ads, timestamps, and rotating promos that would flip the hash without a real stock change.
 */
const SNIPPET_MAX_LEN = 8000;

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function hashCanonical(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const SOLD_OUT_HINTS = [
  "sold out",
  "out of stock",
  "currently unavailable",
  "not available",
  "notify me when available",
  "coming soon",
];

const IN_STOCK_HINTS = ["add to cart", "add to bag"];

function classifyFromText(lower: string): {
  status: PageEvaluation["status"];
  reason: string;
} {
  const soldSignal = SOLD_OUT_HINTS.some((h) => lower.includes(h));
  const buySignal = IN_STOCK_HINTS.some((h) => lower.includes(h));

  if (buySignal && soldSignal) {
    return { status: "unknown", reason: "conflicting_buy_and_sold_signals" };
  }
  if (buySignal) {
    return { status: "in_stock", reason: "add_to_cart_signal" };
  }
  if (soldSignal) {
    return { status: "out_of_stock", reason: "sold_out_signal" };
  }
  return { status: "unknown", reason: "no_commerce_signals" };
}

/**
 * Pure evaluation from visible page text (fixtures / tests / same rules as Playwright path).
 */
export function evaluatePokemonCenterFromBodyText(
  bodyText: string,
  capturedAt: Date = new Date(),
): PageEvaluation {
  const normalized = normalizeWhitespace(bodyText).slice(0, SNIPPET_MAX_LEN);
  const lower = normalized.toLowerCase();

  if (
    lower.includes("access denied") ||
    lower.includes("verify you are human") ||
    lower.includes("are you a robot")
  ) {
    return {
      status: "blocked",
      reason: "possible_gate_or_bot_challenge",
      pageHash: hashCanonical(normalized),
      capturedAt,
    };
  }

  const { status, reason } = classifyFromText(lower);
  return {
    status,
    reason,
    pageHash: hashCanonical(normalized),
    capturedAt,
  };
}

/**
 * Evaluates a Pokémon Center–style product page already loaded in `page`.
 */
export async function evaluatePokemonCenterProductPage(page: Page): Promise<PageEvaluation> {
  const capturedAt = new Date();
  let bodyText = "";
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 45_000 });
    bodyText = await page.locator("body").innerText();
  } catch {
    return {
      status: "unknown",
      reason: "page_load_or_content_failed",
      pageHash: hashCanonical(""),
      capturedAt,
    };
  }
  return evaluatePokemonCenterFromBodyText(bodyText, capturedAt);
}
