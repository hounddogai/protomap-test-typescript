import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRewardRuleOverride } from "./batched-reward-rule-override.js";

test("BatchedRewardRuleOverride starts in open", () => {
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRewardRuleOverride moves to resolved", () => {
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BatchedRewardRuleOverride rejects moves from archived", () => {
  const item = newBatchedRewardRuleOverride("code-46", "name-816");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
