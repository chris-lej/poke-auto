import type { AppConfig } from "../config/loadConfig.js";
import type { NormalizedStockStatus } from "../domain/index.js";
import { errorMessage, redactSecrets } from "../util/index.js";

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
 */
export function createTelegramNotifier(config: AppConfig): TelegramNotifier {
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;

  async function sendAlert(input: SendAlertInput): Promise<void> {
    const url = buildSendMessageUrl(token);
    const body: Record<string, string | number> = {
      chat_id: chatId,
      text: input.text,
    };
    if (input.parseMode) body.parse_mode = input.parseMode;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new Error(`Telegram request failed: ${errorMessage(e)}`);
    }

    if (!res.ok) {
      const snippet = redactSecrets((await res.text()).slice(0, 500), token);
      throw new Error(
        `Telegram sendMessage failed: HTTP ${res.status} ${res.statusText} — ${snippet}`,
      );
    }
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
