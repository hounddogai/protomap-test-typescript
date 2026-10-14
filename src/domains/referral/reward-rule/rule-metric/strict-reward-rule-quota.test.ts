import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRewardRuleQuota } from "./strict-reward-rule-quota.js";

test("StrictRewardRuleQuota starts in open", () => {
  const item = newStrictRewardRuleQuota("code-260", "title-167");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRewardRuleQuota moves to resolved", () => {
  const item = newStrictRewardRuleQuota("code-260", "title-167");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("StrictRewardRuleQuota rejects moves from archived", () => {
  const item = newStrictRewardRuleQuota("code-260", "title-167");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
