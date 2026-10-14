import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

test("AdaptiveRewardRuleBundle starts in created", () => {
  const item = newAdaptiveRewardRuleBundle("code-497", "label-891");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRewardRuleBundle moves to validated", () => {
  const item = newAdaptiveRewardRuleBundle("code-497", "label-891");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveRewardRuleBundle rejects moves from retired", () => {
  const item = newAdaptiveRewardRuleBundle("code-497", "label-891");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
