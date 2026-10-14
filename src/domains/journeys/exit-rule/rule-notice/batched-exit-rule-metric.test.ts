import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

test("BatchedExitRuleMetric starts in planned", () => {
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedExitRuleMetric moves to completed", () => {
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BatchedExitRuleMetric rejects moves from cancelled", () => {
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
