import assert, { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { withRetry } from "../dist/util/retry.js";

describe("withRetry", () => {
  it("recovers after transient failures", async () => {
    let n = 0;
    const result = await withRetry(
      async () => {
        n++;
        if (n < 3) throw new Error("transient");
        return "ok";
      },
      { maxAttempts: 5, baseDelayMs: 1, exponential: false },
    );
    strictEqual(result, "ok");
    strictEqual(n, 3);
  });

  it("respects shouldRetry and stops immediately when false", async () => {
    let n = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            n++;
            throw new Error("bad");
          },
          {
            maxAttempts: 5,
            baseDelayMs: 1,
            shouldRetry: () => false,
          },
        ),
      /bad/,
    );
    strictEqual(n, 1);
  });

  it("throws last error after exhausting attempts", async () => {
    let n = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            n++;
            throw new Error(`fail-${n}`);
          },
          { maxAttempts: 2, baseDelayMs: 1 },
        ),
      /fail-2/,
    );
    strictEqual(n, 2);
  });
});
