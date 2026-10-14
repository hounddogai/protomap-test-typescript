import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleTier } from "./reward-rule-tier.js";

test("RewardRuleTier starts in planned", () => {
  const item = newRewardRuleTier("code-354", "label-936");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleTier moves to in progress", () => {
  const item = newRewardRuleTier("code-354", "label-936");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RewardRuleTier rejects moves from cancelled", () => {
  const item = newRewardRuleTier("code-354", "label-936");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
