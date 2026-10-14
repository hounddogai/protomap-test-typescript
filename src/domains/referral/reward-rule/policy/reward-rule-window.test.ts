import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleWindow } from "./reward-rule-window.js";

test("RewardRuleWindow starts in proposed", () => {
  const item = newRewardRuleWindow("code-720", "name-859");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleWindow moves to rejected", () => {
  const item = newRewardRuleWindow("code-720", "name-859");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardRuleWindow rejects moves from withdrawn", () => {
  const item = newRewardRuleWindow("code-720", "name-859");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
