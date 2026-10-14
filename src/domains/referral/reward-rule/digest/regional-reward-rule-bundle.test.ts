import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRewardRuleBundle } from "./regional-reward-rule-bundle.js";

test("RegionalRewardRuleBundle starts in open", () => {
  const item = newRegionalRewardRuleBundle("code-641", "label-162");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRewardRuleBundle moves to reopened", () => {
  const item = newRegionalRewardRuleBundle("code-641", "label-162");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("RegionalRewardRuleBundle rejects moves from archived", () => {
  const item = newRegionalRewardRuleBundle("code-641", "label-162");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
