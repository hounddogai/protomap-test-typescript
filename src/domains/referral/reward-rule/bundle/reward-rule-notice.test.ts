import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleNotice } from "./reward-rule-notice.js";

test("RewardRuleNotice starts in created", () => {
  const item = newRewardRuleNotice("code-153", "name-490");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleNotice moves to validated", () => {
  const item = newRewardRuleNotice("code-153", "name-490");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RewardRuleNotice rejects moves from retired", () => {
  const item = newRewardRuleNotice("code-153", "name-490");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
