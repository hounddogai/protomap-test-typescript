import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

test("WeightedRewardRuleBudget starts in new", () => {
  const item = newWeightedRewardRuleBudget("code-717", "title-10");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardRuleBudget moves to queued", () => {
  const item = newWeightedRewardRuleBudget("code-717", "title-10");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedRewardRuleBudget rejects moves from failed", () => {
  const item = newWeightedRewardRuleBudget("code-717", "title-10");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
