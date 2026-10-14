import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRewardRuleCheckpoint } from "./lenient-reward-rule-checkpoint.js";

test("LenientRewardRuleCheckpoint starts in draft", () => {
  const item = newLenientRewardRuleCheckpoint("code-658", "title-397");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRewardRuleCheckpoint moves to closed", () => {
  const item = newLenientRewardRuleCheckpoint("code-658", "title-397");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LenientRewardRuleCheckpoint rejects moves from closed", () => {
  const item = newLenientRewardRuleCheckpoint("code-658", "title-397");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
