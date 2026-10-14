import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

test("BatchedSuppressionPlan starts in idle", () => {
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSuppressionPlan moves to ready", () => {
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedSuppressionPlan rejects moves from stopped", () => {
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
