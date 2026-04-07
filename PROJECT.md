# Pokémon Center Restock Notifier

## Purpose

A personal automation tool that watches Pokémon Center product pages and sends alerts when items return to stock.

## Why this exists

Stock appears unpredictably; manual checking is slow and easy to miss. This project exists to turn occasional checks into reliable, low-friction notifications for personal use.

## MVP success criteria

- One or more product URLs can be monitored on a sensible schedule.
- When a monitored item is detected as in stock, a notification is delivered quickly and reliably.
- State is persisted so restarts do not lose context or spam duplicate alerts without reason.
- The codebase stays small, readable, and easy to change.

## Non-goals

The following are explicitly out of scope:

- Purchasing or checkout automation (“autobuy”).
- Circumventing CAPTCHAs, bot protection, or site terms of use.
- Proxy rotation, distributed crawlers, or large-scale scraping infrastructure.
- A web UI, dashboard, or public multi-user product.
- Features whose main purpose is to evade detection rather than to notify you honestly when stock is visible.

## Design principles

- **Simple first:** Prefer a straight path over abstraction layers you do not need yet.
- **Maintainable:** Favor clear names, small modules, and obvious data flow.
- **Reliable enough:** Notifications and persistence matter more than theoretical perfection.
- **Low ceremony:** Few moving parts, minimal dependencies, easy to run locally.

## System overview (high-level flow)

1. **Configure** which products to watch and how to reach you (e.g. Telegram).
2. **Observe** product pages on a schedule using a browser automation layer suited to dynamic pages.
3. **Decide** whether the page indicates in-stock availability versus your last known state.
4. **Notify** when availability changes to in stock (or according to rules you define in tasks later).
5. **Record** outcomes in local storage so the next run can compare and avoid redundant noise.

This is a conceptual flow only; it does not prescribe file layout or libraries beyond what the project stack implies.

## Architecture philosophy

- **Personal tool, not a platform:** Optimize for one operator and one machine.
- **Boring over clever:** Readable control flow beats clever patterns.
- **Explicit boundaries:** Separate “fetch and interpret page,” “persist state,” and “send alerts” conceptually, even if the implementation stays compact.
- **Fail visibly:** When something breaks, errors should be understandable and actionable—not silently swallowed.

## How to interpret `TASKS.md`

- `TASKS.md` is the execution contract for autonomous work: ordered work items with status, intent, goals, and acceptance criteria.
- Agents should treat it as authoritative for *what* to do next, and `PROJECT.md` as authoritative for *why* and *what not to do*.
- Tasks are executed in order; skipping or reordering is not allowed unless a task itself says otherwise.
- Status and execution notes exist to preserve continuity across sessions; keep them accurate.

## Future evolution (not part of MVP)

*The following are ideas only—not commitments or MVP requirements.*

- Additional notification channels beyond the first one you ship.
- Slightly richer configuration (without building a full UI).
- Optional logging or metrics for your own debugging.

Anything listed here should only be pursued after MVP criteria are met and documented in `TASKS.md`.
