import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

test("ManualRewardRuleMetric starts in planned", () => {
  const item = newManualRewardRuleMetric("code-58", "label-841");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardRuleMetric moves to scheduled", () => {
  const item = newManualRewardRuleMetric("code-58", "label-841");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualRewardRuleMetric rejects moves from cancelled", () => {
  const item = newManualRewardRuleMetric("code-58", "label-841");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
