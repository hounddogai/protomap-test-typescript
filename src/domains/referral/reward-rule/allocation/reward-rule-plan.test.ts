import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRulePlan } from "./reward-rule-plan.js";

test("RewardRulePlan starts in open", () => {
  const item = newRewardRulePlan("code-822", "title-244");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRulePlan moves to reopened", () => {
  const item = newRewardRulePlan("code-822", "title-244");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RewardRulePlan rejects moves from archived", () => {
  const item = newRewardRulePlan("code-822", "title-244");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
