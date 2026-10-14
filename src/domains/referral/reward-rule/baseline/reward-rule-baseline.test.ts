import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("RewardRuleBaseline starts in proposed", () => {
  const item = newRewardRuleBaseline("code-989", "name-112");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleBaseline moves to rejected", () => {
  const item = newRewardRuleBaseline("code-989", "name-112");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardRuleBaseline rejects moves from withdrawn", () => {
  const item = newRewardRuleBaseline("code-989", "name-112");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
