import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRewardRulePolicy } from "./batched-reward-rule-policy.js";

test("BatchedRewardRulePolicy starts in idle", () => {
  const item = newBatchedRewardRulePolicy("code-87", "title-579");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRewardRulePolicy moves to draining", () => {
  const item = newBatchedRewardRulePolicy("code-87", "title-579");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedRewardRulePolicy rejects moves from stopped", () => {
  const item = newBatchedRewardRulePolicy("code-87", "title-579");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
