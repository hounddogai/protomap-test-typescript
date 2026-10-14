import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleEntry } from "./reward-rule-entry.js";

test("RewardRuleEntry starts in open", () => {
  const item = newRewardRuleEntry("code-801", "name-883");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleEntry moves to in review", () => {
  const item = newRewardRuleEntry("code-801", "name-883");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("RewardRuleEntry rejects moves from archived", () => {
  const item = newRewardRuleEntry("code-801", "name-883");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
