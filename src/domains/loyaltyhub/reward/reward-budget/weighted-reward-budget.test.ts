import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("WeightedRewardBudget starts in planned", () => {
  const item = newWeightedRewardBudget("code-56", "name-844");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardBudget moves to cancelled", () => {
  const item = newWeightedRewardBudget("code-56", "name-844");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("WeightedRewardBudget rejects moves from cancelled", () => {
  const item = newWeightedRewardBudget("code-56", "name-844");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
