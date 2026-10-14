import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleMilestone } from "./reward-rule-milestone.js";

test("RewardRuleMilestone starts in planned", () => {
  const item = newRewardRuleMilestone("code-806", "title-577");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleMilestone moves to completed", () => {
  const item = newRewardRuleMilestone("code-806", "title-577");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("RewardRuleMilestone rejects moves from cancelled", () => {
  const item = newRewardRuleMilestone("code-806", "title-577");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
