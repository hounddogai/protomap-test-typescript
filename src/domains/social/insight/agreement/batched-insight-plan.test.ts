import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInsightPlan } from "./batched-insight-plan.js";

test("BatchedInsightPlan starts in open", () => {
  const item = newBatchedInsightPlan("code-832", "name-564");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInsightPlan moves to in review", () => {
  const item = newBatchedInsightPlan("code-832", "name-564");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BatchedInsightPlan rejects moves from archived", () => {
  const item = newBatchedInsightPlan("code-832", "name-564");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
