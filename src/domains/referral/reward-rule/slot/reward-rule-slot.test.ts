import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleSlot } from "./reward-rule-slot.js";

test("RewardRuleSlot starts in new", () => {
  const item = newRewardRuleSlot("code-18", "label-955");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleSlot moves to done", () => {
  const item = newRewardRuleSlot("code-18", "label-955");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RewardRuleSlot rejects moves from failed", () => {
  const item = newRewardRuleSlot("code-18", "label-955");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
