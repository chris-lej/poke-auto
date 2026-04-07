import { chromium, type Browser, type Page } from "playwright";
import type { AppConfig } from "../config/loadConfig.js";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * Owns a single Playwright browser instance; use `withPage` so contexts/pages are always closed.
 */
export class BrowserService {
  private browser: Browser | undefined;

  constructor(private readonly config: AppConfig) {}

  async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: !this.config.playwrightHeaded,
      });
    }
    return this.browser;
  }

  /**
   * Creates a fresh browser context and page, runs `fn`, then closes context (and page).
   */
  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const browser = await this.ensureBrowser();
    const context = await browser.newContext({
      userAgent: DEFAULT_USER_AGENT,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT_MS);
    try {
      return await fn(page);
    } finally {
      await context.close();
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}
