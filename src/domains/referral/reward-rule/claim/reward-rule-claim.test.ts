import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleClaim } from "./reward-rule-claim.js";

test("RewardRuleClaim starts in open", () => {
  const item = newRewardRuleClaim("code-826", "label-349");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleClaim moves to in review", () => {
  const item = newRewardRuleClaim("code-826", "label-349");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RewardRuleClaim rejects moves from archived", () => {
  const item = newRewardRuleClaim("code-826", "label-349");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
