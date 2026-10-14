import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleQuota } from "./reward-rule-quota.js";

test("RewardRuleQuota starts in new", () => {
  const item = newRewardRuleQuota("code-942", "label-620");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleQuota moves to done", () => {
  const item = newRewardRuleQuota("code-942", "label-620");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("RewardRuleQuota rejects moves from failed", () => {
  const item = newRewardRuleQuota("code-942", "label-620");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
