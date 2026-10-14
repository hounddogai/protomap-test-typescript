import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleBatch } from "./reward-rule-batch.js";

test("RewardRuleBatch starts in draft", () => {
  const item = newRewardRuleBatch("code-69", "name-765");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleBatch moves to pending", () => {
  const item = newRewardRuleBatch("code-69", "name-765");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RewardRuleBatch rejects moves from closed", () => {
  const item = newRewardRuleBatch("code-69", "name-765");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
