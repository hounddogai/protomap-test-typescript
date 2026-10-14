import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

test("DefaultRewardRuleBudget starts in requested", () => {
  const item = newDefaultRewardRuleBudget("code-907", "title-403");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRewardRuleBudget moves to expired", () => {
  const item = newDefaultRewardRuleBudget("code-907", "title-403");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("DefaultRewardRuleBudget rejects moves from expired", () => {
  const item = newDefaultRewardRuleBudget("code-907", "title-403");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
