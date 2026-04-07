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

_Add tasks below when ready. Until then, this section intentionally has no executable tasks._

---

## 4. Execution command

Execute next TODO task from TASKS.md. Follow AGENT_RULES.md. Use PROJECT.md for context. Do not pause unless required input is missing.
