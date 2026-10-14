import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedPlacementBudget } from "./batched-placement-budget.js";

test("BatchedPlacementBudget starts in new", () => {
  const item = newBatchedPlacementBudget("code-740", "name-936");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedPlacementBudget moves to running", () => {
  const item = newBatchedPlacementBudget("code-740", "name-936");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedPlacementBudget rejects moves from failed", () => {
  const item = newBatchedPlacementBudget("code-740", "name-936");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
