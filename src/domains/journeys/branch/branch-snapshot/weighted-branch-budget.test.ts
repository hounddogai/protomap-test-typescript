import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBranchBudget } from "./weighted-branch-budget.js";

test("WeightedBranchBudget starts in idle", () => {
  const item = newWeightedBranchBudget("code-967", "title-383");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBranchBudget moves to warming", () => {
  const item = newWeightedBranchBudget("code-967", "title-383");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedBranchBudget rejects moves from stopped", () => {
  const item = newWeightedBranchBudget("code-967", "title-383");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
