import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("WeightedRewardRuleSummary starts in open", () => {
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardRuleSummary moves to in review", () => {
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedRewardRuleSummary rejects moves from archived", () => {
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
