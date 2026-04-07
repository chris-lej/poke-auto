# Agent rules

Behavior expectations for autonomous execution on this repository.

## Autonomy and interruptions

- **Act when confidence is high:** Implement, run checks, and document outcomes without waiting for confirmation on routine work.
- **Minimize interruptions:** Do not ask questions unless missing data or credentials block progress and cannot be obtained safely another way.
- **Ask only when strictly required:** Prefer sensible defaults aligned with `PROJECT.md` over polling the user.

## Errors and blockers

- **Fix automatically when possible:** Retries, obvious dependency or config fixes, and small corrective edits are in scope before escalating.
- **Surface clear blockers when stuck:** After genuine attempts fail, report one concise blocker: what failed, likely cause, and the single next step—no vague “something went wrong.”

## Code and repository hygiene

- **Keep code simple and clean:** Match existing style; avoid clever abstractions unless they remove real duplication.
- **Avoid overengineering:** No speculative features, frameworks, or patterns not justified by `TASKS.md` and `PROJECT.md`.
- **Prioritize readability and maintainability:** Future you (or another agent) should understand changes quickly.

## Secrets and commits

- **Never expose or commit secrets:** Tokens, API keys, cookies, database files with sensitive content, and `.env` with real values stay out of git and out of logs in chat or CI output.
- **Commit frequently with clear messages:** Small, logical commits with messages that state what changed and why.

## Task discipline

- Follow **`TASKS.md`** order and update task status and execution notes as you go.
- Use **`PROJECT.md`** to stay within scope and respect non-goals.
