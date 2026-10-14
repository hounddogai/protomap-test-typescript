import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleBundle } from "./reward-rule-bundle.js";

test("RewardRuleBundle starts in requested", () => {
  const item = newRewardRuleBundle("code-11", "name-220");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleBundle moves to granted", () => {
  const item = newRewardRuleBundle("code-11", "name-220");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RewardRuleBundle rejects moves from expired", () => {
  const item = newRewardRuleBundle("code-11", "name-220");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
