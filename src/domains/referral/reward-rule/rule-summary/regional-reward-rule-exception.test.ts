import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

test("RegionalRewardRuleException starts in planned", () => {
  const item = newRegionalRewardRuleException("code-108", "label-628");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalRewardRuleException moves to cancelled", () => {
  const item = newRegionalRewardRuleException("code-108", "label-628");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("RegionalRewardRuleException rejects moves from cancelled", () => {
  const item = newRegionalRewardRuleException("code-108", "label-628");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
