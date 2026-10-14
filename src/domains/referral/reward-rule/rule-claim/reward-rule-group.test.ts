import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleGroup } from "./reward-rule-group.js";

test("RewardRuleGroup starts in draft", () => {
  const item = newRewardRuleGroup("code-179", "name-693");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleGroup moves to active", () => {
  const item = newRewardRuleGroup("code-179", "name-693");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("RewardRuleGroup rejects moves from closed", () => {
  const item = newRewardRuleGroup("code-179", "name-693");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
