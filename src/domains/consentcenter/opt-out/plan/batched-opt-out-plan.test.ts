import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedOptOutPlan } from "./batched-opt-out-plan.js";

test("BatchedOptOutPlan starts in created", () => {
  const item = newBatchedOptOutPlan("code-966", "label-600");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedOptOutPlan moves to validated", () => {
  const item = newBatchedOptOutPlan("code-966", "label-600");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("BatchedOptOutPlan rejects moves from retired", () => {
  const item = newBatchedOptOutPlan("code-966", "label-600");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
