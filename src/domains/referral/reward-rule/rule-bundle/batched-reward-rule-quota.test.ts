import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRewardRuleQuota } from "./batched-reward-rule-quota.js";

test("BatchedRewardRuleQuota starts in created", () => {
  const item = newBatchedRewardRuleQuota("code-700", "title-795");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRewardRuleQuota moves to published", () => {
  const item = newBatchedRewardRuleQuota("code-700", "title-795");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedRewardRuleQuota rejects moves from retired", () => {
  const item = newBatchedRewardRuleQuota("code-700", "title-795");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
