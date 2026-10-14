import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditMetric } from "./credit-metric.js";

test("CreditMetric starts in new", () => {
  const item = newCreditMetric("code-829", "label-978");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditMetric moves to failed", () => {
  const item = newCreditMetric("code-829", "label-978");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("CreditMetric rejects moves from failed", () => {
  const item = newCreditMetric("code-829", "label-978");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
