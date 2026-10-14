import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleReview } from "./reward-rule-review.js";

test("RewardRuleReview starts in planned", () => {
  const item = newRewardRuleReview("code-950", "title-26");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleReview moves to completed", () => {
  const item = newRewardRuleReview("code-950", "title-26");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RewardRuleReview rejects moves from cancelled", () => {
  const item = newRewardRuleReview("code-950", "title-26");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
