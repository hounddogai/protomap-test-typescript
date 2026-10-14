import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

test("AdaptiveRewardRuleEntry starts in created", () => {
  const item = newAdaptiveRewardRuleEntry("code-181", "label-849");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRewardRuleEntry moves to retired", () => {
  const item = newAdaptiveRewardRuleEntry("code-181", "label-849");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("AdaptiveRewardRuleEntry rejects moves from retired", () => {
  const item = newAdaptiveRewardRuleEntry("code-181", "label-849");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
