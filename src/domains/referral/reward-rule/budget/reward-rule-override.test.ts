import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleOverride } from "./reward-rule-override.js";

test("RewardRuleOverride starts in new", () => {
  const item = newRewardRuleOverride("code-576", "title-536");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleOverride moves to queued", () => {
  const item = newRewardRuleOverride("code-576", "title-536");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RewardRuleOverride rejects moves from failed", () => {
  const item = newRewardRuleOverride("code-576", "title-536");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
