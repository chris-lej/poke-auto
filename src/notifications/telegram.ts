import type { AppConfig } from "../config/loadConfig.js";
import type { NormalizedStockStatus } from "../domain/index.js";
import { TelegramSendError, isRetryableTelegramError } from "./telegramErrors.js";
import { errorMessage } from "../util/errors.js";
import { redactSecrets } from "../util/logger.js";
import type { Logger } from "../util/logger.js";
import { withRetry } from "../util/retry.js";
import { retryOptionsFromConfig } from "../util/retryPolicy.js";

export type SendAlertInput = {
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
};

export type TelegramNotifier = {
  sendAlert(input: SendAlertInput): Promise<void>;
  sendStockAlert(input: {
    productUrl: string;
    status: NormalizedStockStatus;
    reason: string;
    observedAt: Date;
  }): Promise<void>;
};

function buildSendMessageUrl(token: string): string {
  return `https://api.telegram.org/bot${token}/sendMessage`;
}

/**
 * Sends Bot API messages. Never logs the request URL (contains token).
 * Retries transient failures (network errors, HTTP 429 / 5xx) with configured backoff (T18).
 */
export function createTelegramNotifier(config: AppConfig, log: Logger): TelegramNotifier {
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;

  async function sendAlert(input: SendAlertInput): Promise<void> {
    const url = buildSendMessageUrl(token);
    const body: Record<string, string | number> = {
      chat_id: chatId,
      text: input.text,
    };
    if (input.parseMode) body.parse_mode = input.parseMode;

    await withRetry(
      async () => {
        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch (e) {
          throw new TelegramSendError(`Telegram request failed: ${errorMessage(e)}`);
        }

        if (!res.ok) {
          const snippet = redactSecrets((await res.text()).slice(0, 500), token);
          throw new TelegramSendError(
            `Telegram sendMessage failed: HTTP ${res.status} ${res.statusText} — ${snippet}`,
            res.status,
          );
        }
      },
      {
        ...retryOptionsFromConfig(config, log, "telegram sendMessage"),
        shouldRetry: isRetryableTelegramError,
      },
    );
  }

  async function sendStockAlert(input: {
    productUrl: string;
    status: NormalizedStockStatus;
    reason: string;
    observedAt: Date;
  }): Promise<void> {
    const lines = [
      `Restock notifier — in stock`,
      ``,
      `URL: ${input.productUrl}`,
      `Status: ${input.status}`,
      `Reason: ${input.reason}`,
      `Time: ${input.observedAt.toISOString()}`,
    ];
    await sendAlert({ text: lines.join("\n") });
  }

  return { sendAlert, sendStockAlert };
}
