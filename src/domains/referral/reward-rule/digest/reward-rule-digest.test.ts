import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleDigest } from "./reward-rule-digest.js";

test("RewardRuleDigest starts in planned", () => {
  const item = newRewardRuleDigest("code-391", "title-197");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleDigest moves to cancelled", () => {
  const item = newRewardRuleDigest("code-391", "title-197");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RewardRuleDigest rejects moves from cancelled", () => {
  const item = newRewardRuleDigest("code-391", "title-197");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
