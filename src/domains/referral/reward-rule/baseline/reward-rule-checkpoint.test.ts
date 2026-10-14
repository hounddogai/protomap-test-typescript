import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

test("RewardRuleCheckpoint starts in idle", () => {
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleCheckpoint moves to ready", () => {
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("RewardRuleCheckpoint rejects moves from stopped", () => {
  const item = newRewardRuleCheckpoint("code-328", "name-140");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
