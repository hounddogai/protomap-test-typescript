import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleTarget } from "./reward-rule-target.js";

test("RewardRuleTarget starts in draft", () => {
  const item = newRewardRuleTarget("code-353", "label-202");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleTarget moves to pending", () => {
  const item = newRewardRuleTarget("code-353", "label-202");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RewardRuleTarget rejects moves from closed", () => {
  const item = newRewardRuleTarget("code-353", "label-202");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
