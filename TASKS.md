# Tasks

This file drives ordered execution for autonomous agents and humans. **Do not implement application logic here**—only tasks, status, and notes.

---

## 1. Execution instructions

- Execute tasks **from top to bottom** in the task list section.
- **Do not skip or reorder** tasks unless a task explicitly defers or supersedes another.
- **Update status** as execution progresses (e.g. TODO → IN PROGRESS → DONE, or BLOCKED when truly stuck).
- **Do not pause** unless required input is missing and cannot be inferred safely.
- **Attempt automatic fixes** (dependency install, obvious config fixes, retries within reason) before reporting a blocker.
- Use **`PROJECT.md`** for product intent, scope, and non-goals.
- Use **`AGENT_RULES.md`** for behavior, safety, and workflow expectations.

---

## 2. Task format

Every task in the list section must follow this structure:

### TXX — Task title

**Status:** TODO

**Intent:**  
Why this task exists (1–2 sentences max)

**Goal:**  
What must be achieved

**Actions:**

- Concrete steps

**Acceptance criteria:**

- Objective definition of done

**Pause only if:**

- ONLY real blockers

**If error:**

- Attempt automatic fix up to 2 times
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- (filled during execution)

---

## 3. Task list

### Phase 1 — Foundation and setup

### T00 — Preflight validation and readiness packet

**Status:** DONE

**Intent:**  
Autonomous runs fail most often when secrets, URLs, or repo assumptions are missing or wrong. This task front-loads every likely input into **one** structured request so later tasks rarely need to stop for clarification. It also confirms defaults align with a local-first, personal MVP.

**Goal:**  
Produce a single “readiness packet” (in `Execution Notes` and/or a non-committed local scratch file if needed) that records all configuration decisions and credentials **references** (never paste secrets into committed files). Nothing in the codebase is required to change in this task unless you choose to add a private local checklist file that is gitignored.

**Actions:**

- Before changing application code, send **one** consolidated request to the project owner (or capture from existing documented context if already complete) that explicitly asks for and records:
  - **GitHub repository name** — default: `pokemon-restock-notifier` if creating a new repo; otherwise use the current `origin` repo name.
  - **Repository visibility** — default: **private**.
  - **Telegram bot token** — required for MVP alerts; obtain from BotFather; store only in environment / secret manager, never in git.
  - **Telegram chat ID** — required destination for alerts; store only via env.
  - **Product URLs** — list of Pokémon Center product page URLs to monitor; default: empty until provided (MVP needs at least one before meaningful monitoring).
  - **Optional discovery seed URLs** — default: none.
  - **Whether discovery is enabled** — default: **false** (must stay off until Phase 3 optional task).
  - **Preferred git branch name** for ongoing work — default: use current tracked branch or `main` if unspecified. **This repo:** long-lived `master` (primary integration branch; avoids auto-merge constraints on `main`).
  - **Preferred SQLite database file path** — default: `./data/restock.db` (directory created in later tasks).
- Document agreed defaults for anything not supplied, explicitly marking assumptions.
- Confirm alignment with `PROJECT.md` non-goals (no autobuy, no CAPTCHA bypass, no proxy rotation, no distributed infra, no dashboard).

**Acceptance criteria:**

- One consolidated input/assumption record exists covering every bullet above (values may be “pending” only where the owner must supply secrets — then **Pause only if** applies).
- Defaults are explicit where values are assumed.
- No secrets are written into tracked files.

**Pause only if:**

- Telegram bot token, Telegram chat ID, or at least one product URL cannot be obtained or assumed and are required to proceed past configuration tasks.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

**Readiness packet (T00 — consolidated assumptions and pending inputs)**

| Item | Value / status |
|------|----------------|
| **GitHub repository** | `chris-lej/poke-auto` (from `origin` URL; not the default name `pokemon-restock-notifier`) |
| **Repository visibility** | Assumed **private** (not verifiable from git alone) |
| **Telegram bot token** | **Pending** — must come from BotFather; store only in environment / secret manager, never in git |
| **Telegram chat ID** | **Pending** — store only via env |
| **Product URLs** | **Pending** — MVP needs at least one URL in env before meaningful monitoring; default empty until supplied |
| **Optional discovery seed URLs** | None (default) |
| **Discovery enabled** | **false** — remains off until Phase 3 optional work (per task default) |
| **Preferred git branch for ongoing work** | **`master`** — long-lived primary branch for ongoing work and agent pushes; `main` remains on origin as historical/default unless you change default branch in GitHub settings |
| **SQLite database file path** | `./data/restock.db` (directory to be created in later tasks) |

**Alignment with `PROJECT.md`:** Confirmed scope: personal restock notifier only; no autobuy, no CAPTCHA/bot evasion, no proxy rotation or distributed infra, no dashboard. No secrets written to tracked files.

---

### T01 — Validate or create repository access context

**Status:** DONE

**Intent:**  
The MVP assumes a GitHub remote exists and the agent can push. This task verifies remotes, branch tracking, and permissions so later commits are not blocked by surprise auth issues.

**Goal:**  
Confirmed read/write access to the intended GitHub repository from this environment, with `origin` pointing at the correct repo and the working branch set as expected.

**Actions:**

- Inspect `git remote -v` and current branch; compare to the readiness packet from T00.
- If `origin` is missing or wrong, add or update it per the packet (without embedding tokens in committed config).
- Run a non-destructive fetch; if appropriate, push an empty commit is **not** required — only verify push capability if a safe test commit already exists or after the next real commit.
- Document in execution notes: repo URL, branch, and whether the repo is the named `pokemon-restock-notifier` or an existing alias.

**Acceptance criteria:**

- `git fetch` (or equivalent) succeeds against `origin`.
- Branch strategy matches T00 (or documented deviation).
- No credentials appear in tracked files.

**Pause only if:**

- GitHub authentication or network policy prevents any read access to `origin`, or the owner must create/move the repository and cannot be represented by agent-safe credentials.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `origin` → `github.com/chris-lej/poke-auto` (HTTPS); read/write verified via successful `git fetch origin` and prior pushes to `origin/master`.
- Working branch: **`master`** (tracks `origin/master`), aligned with T00 readiness packet (long-lived primary branch).
- Repository is **`poke-auto`** / `chris-lej/poke-auto`, not the default name `pokemon-restock-notifier`.

---

### T02 — Create repository operating files

**Status:** DONE

**Intent:**  
A small set of repo-level files prevents accidental commits of secrets and local artifacts, and gives humans a fast on-ramp. This keeps maintenance low for a personal tool.

**Goal:**  
Repository hygiene files exist: ignore rules for Node, env files, local databases, Playwright artifacts, and OS cruft; plus an `.env.example` listing required variable **names** only.

**Actions:**

- Add or update root `.gitignore` to exclude at minimum: `node_modules/`, `.env`, `data/*.db`, `data/*.sqlite`, Playwright output dirs (e.g. `test-results/`, `playwright-report/`), logs if stored under repo, and common OS files.
- Add `.env.example` with placeholder names (no real values), including variables later tasks will require: Telegram token, Telegram chat ID, database path, poll interval if used, discovery flags, product URL list strategy (document whether comma-separated or JSON in env — pick one approach to be implemented in T05).
- Optionally add `.nvmrc` or `engines` field later in T03 — do not duplicate here unless already agreed.

**Acceptance criteria:**

- `.gitignore` and `.env.example` are committed and cover secrets and local DB paths.
- `.env.example` contains no real secrets.

**Pause only if:**

- Project owner mandates a different secret management approach that cannot be expressed as env-based local development.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- Root `.gitignore`: Node, `.env`, `data/*.db` / sqlite, Playwright reports, `dist/`, logs, OS junk.
- `.env.example`: **comma-separated** `PRODUCT_URLS` and `DISCOVERY_SEED_URLS` (documented for T05).

---

### T03 — Bootstrap Node.js and TypeScript project

**Status:** DONE

**Intent:**  
The stack is Node.js + TypeScript + Playwright. This task establishes package metadata, TypeScript compilation, and scripts so subsequent tasks add code in a consistent toolchain.

**Goal:**  
A minimal `package.json`, TypeScript config, and installable dependencies (including Playwright as a dependency and dev tooling as appropriate) with scripts such as `build`, `start`, and `typecheck` (names may vary but must be documented in README later).

**Actions:**

- Initialize or align `package.json` (name aligned with repo, private flag, sensible `engines` if useful).
- Add TypeScript, Node types, and strict-enough `tsconfig.json` for maintainability without enterprise overhead.
- Add Playwright dependency; document that browser install step may be required (`playwright install` or project equivalent).
- Add minimal ESLint or use TypeScript-only discipline — optional; if added, keep config small.
- Ensure `npm install` (or `pnpm`/`yarn` if already chosen consistently) succeeds.

**Acceptance criteria:**

- Clean install succeeds.
- `npm run build` (or documented equivalent) compiles TypeScript without errors.
- Playwright is listed as a dependency and version is pinned sensibly.

**Pause only if:**

- Package manager choice is contested without a default, or corporate mirror blocks registry access entirely.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `package.json`: npm, `type: module`, Node ≥20, scripts `build` / `start` / `typecheck`, dependency `playwright@1.59.1`, dev `typescript` + `@types/node`.
- `tsconfig.json`: `strict`, `outDir` `dist`, `rootDir` `src`, NodeNext modules.
- `.nvmrc`: `20`. After install, run `npx playwright install` for browsers when needed.

---

### T04 — Create folder structure

**Status:** DONE

**Intent:**  
Clear folders reduce coupling and make autonomous edits safer. The structure should reflect boundaries: config, persistence, browser, domain, notifications, orchestration.

**Goal:**  
A documented src layout exists (directories and placeholder `index`/barrel files only if needed) matching the planned modules, without implementing business logic yet.

**Actions:**

- Create something close to: `src/config`, `src/db`, `src/domain`, `src/browser`, `src/evaluators`, `src/notifications`, `src/workers`, `src/app` (adjust names only if mirrored consistently across later tasks).
- Add minimal `README` comments or `src/README` **only if** required for clarity — prefer waiting for T19; otherwise use empty modules with brief file headers.
- Ensure `data/` exists at runtime (may be created by code in T06) — at minimum document expected path.

**Acceptance criteria:**

- Folder structure is present and matches subsequent task responsibilities.
- No substantial business logic implemented beyond stubs required for compilation.

**Pause only if:**

- None for a normal local repo.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- Created `src/config`, `src/db`, `src/domain`, `src/browser`, `src/evaluators`, `src/notifications`, `src/workers`, `src/app` with minimal placeholder modules; DB file path remains `./data/restock.db` (created by app in T06).

---

### T05 — Implement typed configuration and validation

**Status:** DONE

**Intent:**  
Scattered `process.env` reads become inconsistent and leak partial failures. Centralized, validated configuration fails fast at startup with understandable errors — critical for unattended runs.

**Goal:**  
A single configuration module loads from environment variables, validates types and required fields, applies defaults from T00/T02, and exports a typed object used by the rest of the app.

**Actions:**

- Implement one entry point (e.g. `src/config/loadConfig.ts`) that reads env vars and validates them (manual validation or a tiny library — prefer minimal dependencies).
- **Required:** fail fast on missing required values for MVP (at minimum Telegram token, Telegram chat ID, and at least one product URL when running monitor — validation rules may allow “dry” modes if you add them, but default MVP path should require them for production run).
- Support: database path (default `./data/restock.db`), polling interval with conservative default, product URL list parsing as documented in `.env.example`, discovery enabled flag default false.
- **Do not** read `process.env` outside this module except in tests if absolutely necessary.
- Document all variables in `.env.example` updated if new keys appear.

**Acceptance criteria:**

- Importing config throws or exits with a clear message when required vars are missing or malformed.
- Typed config object is the only supported access pattern for application code.
- No secrets logged.

**Pause only if:**

- Owner refuses to provide required env vars and insists on running without Telegram — then clarify MVP scope with owner.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- Implemented `src/config/loadConfig.ts` + `src/config/index.ts`: `loadConfig()` / `getConfig()`, typed `AppConfig`.
- Production path requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and at least one URL in comma-separated `PRODUCT_URLS`.
- `DRY_RUN=true` relaxes Telegram and product URL requirements for tooling.
- Defaults: `DATABASE_PATH=./data/restock.db`, `POLL_INTERVAL_SECONDS=300`, `DISCOVERY_ENABLED=false`; discovery on requires non-empty `DISCOVERY_SEED_URLS`.
- No `process.env` reads outside this module; secrets are not logged.
- `LOG_LEVEL`: `debug` | `info` | `warn` | `error` (default `info`).
- `ALERT_DEBOUNCE_SECONDS`: non-negative integer (default `0`) — used by alert decision in T13+.

---

### Phase 2 — Core persistence and evaluation

### T06 — Implement SQLite initialization and schema

**Status:** DONE

**Intent:**  
SQLite gives durable state across restarts without operational overhead. The schema must support current status, history for debugging, and idempotent monitoring without SKU-level modeling.

**Goal:**  
Database initialization creates a file at the configured path (creating parent directories as needed) and applies a minimal schema for MVP.

**Actions:**

- Use `better-sqlite3` or `sql.js` — choose one with clear sync/async story; prefer simplest that runs well locally (document choice).
- Create tables at minimum:
  - **`products`**: stable row per monitored URL (id, url, optional human title if later extracted, created_at, updated_at).
  - **`product_status`**: current snapshot per product (product_id FK, normalized status enum text, last_reason text, last_page_hash text, last_checked_at, last_alerted_at nullable).
  - **`status_history`**: append-only history (id, product_id, observed_at, normalized status, reason, page_hash) for auditing and future tuning.
- Add indexes sensible for lookups by `product_id` and recent history.
- Provide migration or `CREATE IF NOT EXISTS` strategy that is safe on restart.

**Acceptance criteria:**

- First run creates DB file and tables without manual SQL from the user.
- Subsequent runs do not duplicate tables or corrupt data.
- Schema matches this task’s named tables and purposes.

**Pause only if:**

- SQLite native build fails in the target environment and cannot be fixed with documented build tools in two attempts.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- Library: **`better-sqlite3`** (synchronous API, native addon, simple for a local single-process poller).
- `initDatabase(path)`: creates parent dirs, enables WAL + foreign keys, runs `CREATE TABLE IF NOT EXISTS` + indexes (`status_history` by `product_id` and `(product_id, observed_at DESC)`).
- Tables: `products` (id, url UNIQUE, title, created_at, updated_at), `product_status` (1:1 FK to products), `status_history` (append-only).

---

### T07 — Implement repository layer

**Status:** DONE

**Intent:**  
SQL scattered through workers becomes error-prone. A thin repository layer keeps persistence operations explicit and testable.

**Goal:**  
Functions or a small class group all reads/writes for products, current status, and history inserts behind a narrow API.

**Actions:**

- Implement CRUD helpers: upsert product by URL, fetch all monitored products, read current `product_status`, write updated status, append `status_history`.
- Ensure transactions where needed (e.g. update current status + insert history).
- Keep SQL strings localized to this layer.

**Acceptance criteria:**

- No other module opens raw DB connections except through this layer (except initialization entry).
- Operations are idempotent for repeated upserts of the same URL.
- History row is written whenever status evaluation produces a new snapshot decision (exact hooking finalized in later tasks, but API must support it).

**Pause only if:**

- None once T06 succeeds.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `createProductRepository(db)` in `src/db/repository.ts`: `upsertProductByUrl`, `getAllProducts`, `getProductStatus`, `recordStatusSnapshot` (transaction: history insert + `product_status` upsert), `setLastAlertedAt`.
- Row types in `src/db/types.ts`; `src/db/index.ts` re-exports init + repository + types.
- App bootstrap (`main.ts`) opens DB via `initDatabase` from config path only; no other module opens connections yet.

---

### T08 — Implement logging and utility helpers

**Status:** DONE

**Intent:**  
Phone-driven supervision depends on readable logs. Small helpers for timestamps, structured one-line logs, and error wrapping reduce noise and avoid leaking secrets.

**Goal:**  
A minimal logging utility used across services with levels (info/warn/error) and consistent formatting; helpers for safe error messages.

**Actions:**

- Implement simple logger (console-based is fine) with level gating via env (default info).
- Redact known secret patterns if feasible without heavy deps; at minimum never log bot token or full env dump.
- Add small utilities as needed: sleep, retry wrapper base (extended in T18), time helpers.

**Acceptance criteria:**

- Workers use the logger instead of ad hoc `console.log` except in bootstrap edge cases documented inline.
- No secret values appear in log output in normal operation.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `src/util/logger.ts`: `createLogger` / `getLogger()` with levels from `LOG_LEVEL` in config (default `info`); ISO timestamp + JSON meta; `redactSecrets` strips bot token substring and `bot…` patterns; never dumps env.
- `sleep`, `withRetry` (base + optional exponential backoff), `nowIso`, `errorMessage` in `src/util/`.
- `main.ts` uses `getLogger()` instead of raw `console` (bootstrap only).

---

### T09 — Implement domain types and normalized status model

**Status:** DONE

**Intent:**  
A small domain model keeps “what we think stock is” consistent between evaluator, DB, and alerts. MVP avoids SKU granularity — URL-level is enough.

**Goal:**  
Shared TypeScript types/enums for normalized stock states (e.g. `in_stock`, `out_of_stock`, `unknown`, `blocked` if needed) and evaluation result shape used across layers.

**Actions:**

- Define normalized status union or enum and map evaluator outputs strictly into this set.
- Define `PageEvaluation` (names flexible) including: `status`, `reason` (short machine-friendly string), `pageHash` (hash of canonical snippet or full HTML per implementation choice), `capturedAt`.
- Document meaning of each status for future maintainers in comments (brief).

**Acceptance criteria:**

- Evaluator, DB writes, and alert logic all import the same types.
- No duplicate conflicting string literals for statuses outside this module.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `NormalizedStockStatus` union + `NORMALIZED_STOCK_STATUSES` + `isNormalizedStockStatus` in `src/domain/stockStatus.ts` (brief comment on each state).
- `PageEvaluation` in `src/domain/pageEvaluation.ts`; barrel `src/domain/index.ts`.

---

### T10 — Implement Playwright browser service

**Status:** DONE

**Intent:**  
Pokémon Center pages are dynamic; Playwright provides a reliable browser context. Centralizing launch, context, timeouts, and teardown avoids leaks during scheduled runs.

**Goal:**  
A reusable service can open a browser, navigate to a URL, return page content or handle, and close cleanly with timeouts appropriate for a personal poller.

**Actions:**

- Implement browser launch singleton or factory with explicit `close()` lifecycle.
- Configure reasonable timeouts and user-agent policy: use a normal desktop user-agent string; **do not** implement evasion tactics contrary to `PROJECT.md`.
- Expose methods: `withPage<T>(fn)` or similar pattern ensuring closure on success/failure.
- Document headless vs headed via env flag for local debugging defaulting to headless.

**Acceptance criteria:**

- Opening and closing the browser does not leak processes across iterations in a simple loop test.
- Navigation errors propagate with clear messages.

**Pause only if:**

- Playwright browsers cannot be installed due to environment restrictions after documented install attempts.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `BrowserService` in `src/browser/browserService.ts`: `ensureBrowser`, `withPage(fn)` (always closes context), `close()`.
- Chromium, desktop user-agent string, default navigation timeout 60s, `headless` from `PLAYWRIGHT_HEADED` / config.

---

### T11 — Implement Pokémon Center product page evaluator

**Status:** DONE

**Intent:**  
Stock detection must be simple and robust: prefer coarse signals like “Add to Cart” vs “Sold Out” over fragile CSS selectors that break weekly. Returning a hash supports detecting silent page changes.

**Goal:**  
Given a product URL and a Playwright page, return a `PageEvaluation` with normalized status, reason code, and page hash.

**Actions:**

- Navigate and wait for key commerce signals (text or buttons) with conservative timeouts.
- Implement detection logic that classifies into normalized statuses from T09; prefer straightforward string includes on stable-visible text where possible.
- Compute `pageHash` from a canonical subset (e.g. main product title + availability region text) rather than entire noisy HTML if that reduces false flip-flops — document tradeoff briefly in code comments.
- Return `unknown` when signals conflict or page structure unexpected; include reason.
- **Do not** add CAPTCHA bypass, bot evasion, or autobuy interactions.

**Acceptance criteria:**

- For a known in-stock and known out-of-stock fixture HTML (checked in tests or manual dev notes if tests impractical), evaluator returns expected classification.
- Always returns all fields required by T09 shape.
- Logic is readable and localized to one module.

**Pause only if:**

- Live site structure cannot be accessed at all from environment to complete even manual verification — then document and agree fixture-based approach with owner.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `evaluatePokemonCenterProductPage(page)` in `src/evaluators/pokemonCenterProduct.ts`: waits for `domcontentloaded`, reads `body` inner text; `evaluatePokemonCenterFromBodyText` shares the same rules for fixtures/tests; `pageHash` = sha256 of canonical snippet (comment explains vs full HTML). `npm test` runs fixture assertions on compiled output.

---

### Phase 3 — Alerts and orchestration

### T12 — Implement Telegram notification service

**Status:** DONE

**Intent:**  
Telegram is the MVP alert channel. A dedicated service isolates HTTP calls, formatting, and failure handling from monitoring logic.

**Goal:**  
Send a formatted message to the configured chat using Bot API via `fetch` or minimal HTTP client, with clear errors on failure.

**Actions:**

- Implement `sendAlert({ text, parseMode? })` or similar using token and chat ID from config.
- Include helpful context in message template: product URL, normalized status, timestamp, short reason; avoid huge HTML dumps.
- Handle non-200 responses with structured log + thrown error for worker to catch.
- Never log full request URL containing token.

**Acceptance criteria:**

- A test invocation (script or temporary harness) can send a message successfully when valid credentials are present.
- Failures produce actionable logs without leaking secrets.

**Pause only if:**

- Valid Telegram credentials are unavailable after T00.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `createTelegramNotifier(config)` in `src/notifications/telegram.ts`: `sendAlert`, `sendStockAlert` (URL, status, reason, ISO time); POST JSON to `sendMessage`; errors throw with redacted body snippet — **never** log full API URL (token).
- Harness: `npm run telegram:test` → `dist/scripts/telegramTest.js` (requires real `.env` / env vars; not run in CI).

---

### T13 — Implement alert decision logic

**Status:** DONE

**Intent:**  
Alert fatigue breaks trust. Alerts should fire only on meaningful transitions (e.g. `out_of_stock` → `in_stock` or `unknown` → `in_stock` per agreed policy), and duplicates should be suppressed using persisted state.

**Goal:**  
Pure function or small service that, given previous normalized status (nullable for first run) and new evaluation, decides whether to alert and why.

**Actions:**

- Implement rules: **must** alert on transition to `in_stock` from non-in-stock states defined explicitly (at minimum from `out_of_stock`; decide policy for `unknown` → `in_stock` and document).
- **Do not** alert on repeated `in_stock` without an intervening non-in-stock observation unless explicitly configured (default off).
- Persist `last_alerted_at` only via worker using repository APIs in later tasks — this task only implements decision output: `{ shouldAlert: boolean, reason: string }`.
- Include debounce guard if same transition repeats due to hash flapping — optional simple time window using config.

**Acceptance criteria:**

- Unit tests or table-driven checks cover primary transitions and duplicate suppression scenarios.
- Behavior matches comments and does not alert on unchanged stable `in_stock`.

**Pause only if:**

- Owner mandates conflicting alert rules that contradict MVP clarity — resolve wording with owner.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `decideAlert` in `src/domain/alertDecision.ts`: alert only when `evaluation.status === in_stock` and prior is not `in_stock` (including first run); `unknown`/`blocked`/`out_of_stock` → `in_stock` all alert. Optional `ALERT_DEBOUNCE_SECONDS` suppresses repeat in-stock alerts using `last_alerted_at`. Table tests: `tests/alert-decision.test.mjs`.

---

### T14 — Implement monitor worker

**Status:** DONE

**Intent:**  
The monitor worker ties together browser, evaluator, persistence, and alert decisioning for each product URL on each tick.

**Goal:**  
For each product: fetch page, evaluate, write history + current status, invoke Telegram service **only** when decision says so, update `last_alerted_at` appropriately.

**Actions:**

- Orchestrate sequence: load products from DB, for each run evaluator inside browser service, compare to prior status from `product_status`.
- Insert `status_history` whenever evaluation yields a new snapshot (even if no alert).
- Update `product_status` fields including timestamps and hash.
- On alert, send Telegram message; if send fails, log error and avoid marking alerted if not actually delivered (choose consistent policy and document).
- Respect non-goals: no checkout automation.

**Acceptance criteria:**

- End-to-end dry run (with mocked Telegram optional in tests) shows DB updates consistent with evaluations.
- Successful alert path updates `last_alerted_at`.
- Failures in one product do not silently abort entire batch without logging.

**Pause only if:**

- None once upstream modules exist.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `runMonitorTick` in `src/workers/monitorWorker.ts`: loads all DB products, `page.goto` + `evaluatePokemonCenterProductPage` inside `withPage`. If status+reason+hash unchanged vs `product_status`, only `touchLastChecked` (no duplicate history). Else `recordStatusSnapshot` then `decideAlert`; on send failure logs error and **does not** call `setLastAlertedAt`. Dry run / no Telegram: logs “would send” and skips send. Per-product try/catch.

---

### T15 — Implement product seeding from config

**Status:** DONE

**Intent:**  
Products must exist in SQLite before monitoring loops are meaningful. Seeding from env keeps MVP simple without a UI.

**Goal:**  
On startup (or explicit command), upsert all configured product URLs into `products` table idempotently.

**Actions:**

- Read product URL list from typed config (T05).
- Upsert each into `products`, preserving stable IDs across runs.
- Log count of seeded products.
- Optionally support removing products no longer in config — default: **do not** auto-delete without explicit flag to avoid accidental data loss; document behavior.

**Acceptance criteria:**

- First run creates rows for all URLs; second run does not duplicate rows.
- Behavior for removed URLs is documented and intentional.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `seedProductsFromConfig` in `src/workers/seedProducts.ts`: upserts each `config.productUrls` URL; **does not** delete rows removed from env (documented in file comment).

---

### T16 — Implement app entrypoint and scheduler

**Status:** DONE

**Intent:**  
Local-first execution needs a single command that runs forever on a schedule (or cron-friendly single-shot mode if chosen — pick one primary model and document).

**Goal:**  
Running one documented command starts the monitor loop at the configured interval with graceful shutdown on SIGINT/SIGTERM.

**Actions:**

- Implement `src/app/main.ts` (or equivalent) that loads config, opens DB, seeds products, then enters loop: sleep interval → monitor worker → repeat.
- Ensure graceful shutdown closes browser and DB.
- Expose npm script `start` for production-style run and `dev` if useful.
- Document interval precision expectations (drift acceptable for MVP).

**Acceptance criteria:**

- Process starts, performs at least one tick, and shuts down cleanly on signal in manual test.
- No orphaned browser processes after shutdown in manual check.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

- `src/app/main.ts`: `initDatabase` → `runMonitorTick` loop with **interval = poll interval minus tick duration** (drift acceptable); sleep in 1s slices for responsive SIGINT/SIGTERM; `browser.close()` + `db.close()` in `finally`. Scripts: `npm start`, `npm run dev` (build+start).
- Logger uses explicit `createLogger` from config (not `getLogger` singleton) so log level matches startup config.

---

### T17 — Implement optional discovery worker

**Status:** TODO

**Intent:**  
Discovery helps find candidate URLs from listing pages **after** core monitoring is trustworthy. This is optional and off by default to avoid scope creep before the MVP path works.

**Goal:**  
If and only if discovery is enabled in config **and** Phase 3 core monitoring tasks (T12–T16) are already accepted as done, implement a worker that visits seed listing URLs, collects product links with simple heuristics, and upserts them into `products`. If discovery is disabled, ship a no-op or guarded stub that documents how to enable later without breaking builds.

**Actions:**

- Gate all discovery behavior behind config flag defaulting false from T00/T05.
- When enabled, fetch listing pages in Playwright, extract absolute product URLs, filter to Pokémon Center product paths, dedupe, upsert via repository.
- Log counts; never alert via Telegram for discovery events.
- If disabled: ensure code path is explicit and documented; no network calls for discovery.

**Acceptance criteria:**

- With flag off, application behavior is unchanged from pre-T17 aside from harmless imports or documented stubs.
- With flag on, new URLs appear in `products` after a run (verified in DB), without breaking monitor loop.

**Pause only if:**

- Owner enables discovery but provides no seed URLs — then ask for seeds or disable flag.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

-

---

### T18 — Add resilience and retry behavior

**Status:** TODO

**Intent:**  
Transient network or site blips should not permanently derail a personal poller. Bounded retries keep the system self-healing without complex infra.

**Goal:**  
Consistent retry policy for navigations and Telegram sends (if not already adequate), with backoff and caps, integrated without obscuring real failures.

**Actions:**

- Introduce small retry helper (from T08 or new) with max attempts and exponential or fixed backoff **documented**.
- Apply to Playwright navigation and Telegram HTTP calls at minimum.
- Ensure final failure surfaces clear logs and does not corrupt DB (write `unknown` or last good state with reason, per policy documented).

**Acceptance criteria:**

- Simulated transient failure (e.g. temporary throw) recovers within retry budget in a unit-style test or controlled manual scenario.
- After exhausting retries, logs show clear final error.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

-

---

### T19 — Expand README with setup and usage

**Status:** TODO

**Intent:**  
Future agents and humans need a single setup path: install, env, run, troubleshooting — without a dashboard.

**Goal:**  
README includes end-to-end instructions aligned with actual scripts and env vars.

**Actions:**

- Document prerequisites (Node version, Playwright browser install).
- Document env vars mirroring `.env.example`.
- Document how to run locally, expected first-run behavior, and where DB file lives.
- Include brief troubleshooting for Telegram misconfiguration and Playwright install issues.
- Link to `PROJECT.md` for scope and non-goals.

**Acceptance criteria:**

- A fresh clone + README steps are sufficient for a knowledgeable user to run the monitor (assuming secrets provided).
- No secrets appear in README.

**Pause only if:**

- None.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

-

---

### T20 — Run smoke validation and fix obvious issues

**Status:** TODO

**Intent:**  
The MVP is “done” when a realistic smoke path works: seed, poll once, persist, and optionally send a test alert in a controlled manner.

**Goal:**  
Execute an end-to-end smoke checklist, fix obvious defects found, and record outcomes in execution notes without expanding scope into non-MVP features.

**Actions:**

- Run typecheck/build, start app against test config or staging env with real credentials **without** committing them.
- Verify DB tables receive expected rows after one tick.
- Verify evaluator classifications for at least one configured live URL (or fixture if live blocked) and confirm alert decision behavior.
- If Telegram test would spam owner, use a dry-run flag if implemented, or send a single clearly labeled test message with owner consent documented in notes.
- Fix obvious bugs discovered; do not add autobuy, proxies, or dashboard.

**Acceptance criteria:**

- Smoke checklist passes or deviations are documented as known limitations with reasons.
- CI/local quality gates that were added remain green.
- `TASKS.md` statuses updated for completed tasks (through T20) if process requires.

**Pause only if:**

- Live Pokémon Center or Telegram is unreachable from environment for reasons outside agent control after retries — document and stop with one blocker.

**If error:**

- Attempt automatic fix up to 2 times; keep fixes grounded and minimal.
- If still failing, report **ONE** clear blocker with:
  - what failed
  - likely cause
  - exact next step

**Execution Notes:**

-

---

## 4. Execution command

Execute next TODO task from TASKS.md. Follow AGENT_RULES.md. Use PROJECT.md for context. Do not pause unless required input is missing.
