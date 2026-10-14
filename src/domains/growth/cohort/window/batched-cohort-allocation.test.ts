import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCohortAllocation } from "./batched-cohort-allocation.js";

test("BatchedCohortAllocation starts in new", () => {
  const item = newBatchedCohortAllocation("code-197", "name-240");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCohortAllocation moves to failed", () => {
  const item = newBatchedCohortAllocation("code-197", "name-240");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BatchedCohortAllocation rejects moves from failed", () => {
  const item = newBatchedCohortAllocation("code-197", "name-240");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
