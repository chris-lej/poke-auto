# poke-auto

Personal poller for **Pokémon Center** product pages: checks stock on a schedule, stores state in **SQLite**, and can send **Telegram** alerts when an item moves to **in stock**. Optional **discovery** scrapes product links from listing pages you configure.

Scope and explicit non-goals (no autobuy, no CAPTCHA bypass, etc.) are in [`PROJECT.md`](./PROJECT.md).

## Prerequisites

- **Node.js 20+** (see `.nvmrc`)
- npm (comes with Node)

## Setup

```bash
git clone <your-repo-url>
cd poke-auto
npm install
npx playwright install chromium
cp .env.example .env
```

Edit **`.env`** with your Telegram bot token, chat ID, and at least one product URL. Never commit `.env`.

## Environment variables

Mirrors [`.env.example`](./.env.example). Important keys:

| Variable | Purpose |
|----------|---------|
| `DRY_RUN` | `true` skips requiring Telegram + `PRODUCT_URLS` (local experiments only). |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Required when `DRY_RUN` is false. |
| `PRODUCT_URLS` | Comma-separated product page URLs (no spaces). |
| `DATABASE_PATH` | SQLite file (default `./data/restock.db`; parent dirs created automatically). |
| `POLL_INTERVAL_SECONDS` | Seconds between full monitor cycles (default `300`). |
| `DISCOVERY_ENABLED` | `true` to scrape listing pages each tick. |
| `DISCOVERY_SEED_URLS` | Comma-separated listing/category URLs on `pokemoncenter.com` (required if discovery is on). |
| `PLAYWRIGHT_HEADED` | `true` for a visible browser (debug). |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error`. |
| `ALERT_DEBOUNCE_SECONDS` | Cooldown after an in-stock alert (0 = off). |
| `RETRY_MAX_ATTEMPTS`, `RETRY_BASE_DELAY_MS`, `RETRY_EXPONENTIAL` | Retries for navigation and Telegram. |

## Run

```bash
npm run build
npm start
```

Development (build then run):

```bash
npm run dev
```

### Telegram test message

After configuring real credentials in `.env`:

```bash
npm run telegram:test
```

Sends a single labeled test message (safe to delete in chat).

### Tests

```bash
npm test
```

## First-run behavior

1. Creates the SQLite file at `DATABASE_PATH` and tables if missing.
2. Upserts every URL from `PRODUCT_URLS` into the `products` table.
3. If `DISCOVERY_ENABLED=true`, visits each seed URL first on every tick, adds discovered product links to `products`.
4. For each product row, opens the page in Playwright, evaluates stock text heuristics, appends to `status_history` when the snapshot changes, and sends Telegram only on configured **in-stock transitions**.

The monitor loop sleeps for roughly `POLL_INTERVAL_SECONDS` minus the time the tick took (some drift is normal).

## Troubleshooting

**Telegram `401` / “Unauthorized”** — Bot token wrong or revoked; create a new bot with [@BotFather](https://t.me/BotFather) and update `TELEGRAM_BOT_TOKEN`.

**Telegram `400` / chat not found** — `TELEGRAM_CHAT_ID` wrong; for a private chat, send any message to the bot first, then use `getUpdates` or a bot helper to read your chat id.

**Playwright “Executable doesn’t exist”** — Run `npx playwright install chromium` (or `npx playwright install` for all browsers).

**Empty or wrong stock signals** — The evaluator uses simple page text cues; site changes may require adjusting [`src/evaluators/pokemonCenterProduct.ts`](./src/evaluators/pokemonCenterProduct.ts).

## Task tracker

Autonomous work order and status: [`TASKS.md`](./TASKS.md).
