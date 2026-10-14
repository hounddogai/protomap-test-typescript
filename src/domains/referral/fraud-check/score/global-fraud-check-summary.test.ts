import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFraudCheckSummary } from "./global-fraud-check-summary.js";

test("GlobalFraudCheckSummary starts in draft", () => {
  const item = newGlobalFraudCheckSummary("code-200", "label-443");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFraudCheckSummary moves to pending", () => {
  const item = newGlobalFraudCheckSummary("code-200", "label-443");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("GlobalFraudCheckSummary rejects moves from closed", () => {
  const item = newGlobalFraudCheckSummary("code-200", "label-443");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
