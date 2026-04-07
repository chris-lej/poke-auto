import type { AppConfig } from "../config/loadConfig.js";
import type { ProductRepository } from "../db/repository.js";
import {
  decideAlert,
  isNormalizedStockStatus,
  type NormalizedStockStatus,
} from "../domain/index.js";
import { evaluatePokemonCenterProductPage } from "../evaluators/index.js";
import { BrowserService } from "../browser/index.js";
import type { TelegramNotifier } from "../notifications/index.js";
import type { Logger } from "../util/index.js";
import { errorMessage, withConfiguredRetry } from "../util/index.js";

function parsePriorStatus(
  raw: string | undefined,
): NormalizedStockStatus | null {
  if (!raw || !isNormalizedStockStatus(raw)) return null;
  return raw;
}

function parseOptionalIsoDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * One full pass over all products in the DB: navigate, evaluate, persist, optional Telegram.
 * Per-product errors are logged; other products still run.
 */
export async function runMonitorTick(input: {
  repo: ProductRepository;
  browser: BrowserService;
  config: AppConfig;
  log: Logger;
  telegram: TelegramNotifier | null;
}): Promise<void> {
  const { repo, browser, config, log, telegram } = input;
  const products = repo.getAllProducts();

  for (const p of products) {
    try {
      const prior = repo.getProductStatus(p.id);
      const previousStatus = parsePriorStatus(prior?.normalized_status);
      const lastAlertedAt = parseOptionalIsoDate(prior?.last_alerted_at ?? null);

      let evaluation;
      try {
        evaluation = await browser.withPage(async (page) => {
          await withConfiguredRetry(config, log, `goto ${p.url}`, async () => {
            await page.goto(p.url, { waitUntil: "domcontentloaded" });
          });
          return evaluatePokemonCenterProductPage(page);
        });
      } catch (e) {
        const msg = errorMessage(e);
        log.error(`monitor failed for product ${p.id} (${p.url}): ${msg}`);
        const capturedAt = new Date();
        const reason = msg.includes("Executable doesn't exist")
          ? "browser_not_installed"
          : "navigation_failed_after_retries";
        repo.recordStatusSnapshot(p.id, {
          normalizedStatus: "unknown",
          reason,
          pageHash: "",
          observedAt: capturedAt,
        });
        continue;
      }

      const unchanged =
        prior !== undefined &&
        prior.normalized_status === evaluation.status &&
        prior.last_page_hash === evaluation.pageHash &&
        prior.last_reason === evaluation.reason;

      if (unchanged) {
        repo.touchLastChecked(p.id, evaluation.capturedAt);
        continue;
      }

      const decision = decideAlert({
        previousStatus,
        evaluation,
        lastAlertedAt,
        debounceSeconds: config.alertDebounceSeconds,
      });

      repo.recordStatusSnapshot(p.id, {
        normalizedStatus: evaluation.status,
        reason: evaluation.reason,
        pageHash: evaluation.pageHash,
        observedAt: evaluation.capturedAt,
      });

      if (!decision.shouldAlert) {
        continue;
      }

      if (config.dryRun || !telegram) {
        log.info("would send in-stock alert (dry run or no Telegram)", {
          productId: p.id,
          decisionReason: decision.reason,
        });
        continue;
      }

      try {
        await telegram.sendStockAlert({
          productUrl: p.url,
          status: evaluation.status,
          reason: evaluation.reason,
          observedAt: evaluation.capturedAt,
        });
        repo.setLastAlertedAt(p.id, new Date());
        log.info("alert sent", { productId: p.id, url: p.url });
      } catch (e) {
        log.error(`alert failed for product ${p.id}: ${errorMessage(e)}`);
      }
    } catch (e) {
      log.error(`monitor error for product ${p.id} (${p.url}): ${errorMessage(e)}`);
    }
  }
}
