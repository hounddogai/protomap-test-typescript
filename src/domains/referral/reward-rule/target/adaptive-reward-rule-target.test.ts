import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

test("AdaptiveRewardRuleTarget starts in open", () => {
  const item = newAdaptiveRewardRuleTarget("code-773", "title-78");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRewardRuleTarget moves to in review", () => {
  const item = newAdaptiveRewardRuleTarget("code-773", "title-78");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("AdaptiveRewardRuleTarget rejects moves from archived", () => {
  const item = newAdaptiveRewardRuleTarget("code-773", "title-78");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
