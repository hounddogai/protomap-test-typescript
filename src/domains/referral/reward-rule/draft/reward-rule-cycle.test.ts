import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleCycle } from "./reward-rule-cycle.js";

test("RewardRuleCycle starts in created", () => {
  const item = newRewardRuleCycle("code-605", "label-230");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleCycle moves to validated", () => {
  const item = newRewardRuleCycle("code-605", "label-230");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RewardRuleCycle rejects moves from retired", () => {
  const item = newRewardRuleCycle("code-605", "label-230");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
