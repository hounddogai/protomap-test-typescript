import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRewardRuleEstimate } from "./batched-reward-rule-estimate.js";

test("BatchedRewardRuleEstimate starts in draft", () => {
  const item = newBatchedRewardRuleEstimate("code-94", "label-860");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRewardRuleEstimate moves to pending", () => {
  const item = newBatchedRewardRuleEstimate("code-94", "label-860");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedRewardRuleEstimate rejects moves from closed", () => {
  const item = newBatchedRewardRuleEstimate("code-94", "label-860");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
