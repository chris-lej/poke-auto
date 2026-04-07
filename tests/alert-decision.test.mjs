import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { decideAlert } from "../dist/domain/alertDecision.js";

const baseEval = (status) => ({
  status,
  reason: "test",
  pageHash: "abc",
  capturedAt: new Date("2026-01-01T12:00:00Z"),
});

describe("decideAlert", () => {
  it("does not alert when evaluation is not in_stock", () => {
    const d = decideAlert({
      previousStatus: "out_of_stock",
      evaluation: baseEval("out_of_stock"),
      lastAlertedAt: null,
      debounceSeconds: 0,
    });
    strictEqual(d.shouldAlert, false);
    strictEqual(d.reason, "not_in_stock");
  });

  it("does not alert on stable in_stock", () => {
    const d = decideAlert({
      previousStatus: "in_stock",
      evaluation: baseEval("in_stock"),
      lastAlertedAt: null,
      debounceSeconds: 0,
    });
    strictEqual(d.shouldAlert, false);
    strictEqual(d.reason, "already_in_stock");
  });

  it("alerts on out_of_stock to in_stock", () => {
    const d = decideAlert({
      previousStatus: "out_of_stock",
      evaluation: baseEval("in_stock"),
      lastAlertedAt: null,
      debounceSeconds: 0,
    });
    strictEqual(d.shouldAlert, true);
    strictEqual(d.reason, "transition_out_of_stock_to_in_stock");
  });

  it("alerts on unknown to in_stock", () => {
    const d = decideAlert({
      previousStatus: "unknown",
      evaluation: baseEval("in_stock"),
      lastAlertedAt: null,
      debounceSeconds: 0,
    });
    strictEqual(d.shouldAlert, true);
    strictEqual(d.reason, "transition_unknown_to_in_stock");
  });

  it("alerts on first observation in_stock", () => {
    const d = decideAlert({
      previousStatus: null,
      evaluation: baseEval("in_stock"),
      lastAlertedAt: null,
      debounceSeconds: 0,
    });
    strictEqual(d.shouldAlert, true);
    strictEqual(d.reason, "first_observation_in_stock");
  });

  it("suppresses when debounce window not elapsed", () => {
    const d = decideAlert({
      previousStatus: "out_of_stock",
      evaluation: baseEval("in_stock"),
      lastAlertedAt: new Date(),
      debounceSeconds: 3600,
    });
    strictEqual(d.shouldAlert, false);
    strictEqual(d.reason, "debounced_after_recent_alert");
  });
});
