import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

test("SeasonalExitRuleMetric starts in draft", () => {
  const item = newSeasonalExitRuleMetric("code-237", "label-304");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalExitRuleMetric moves to pending", () => {
  const item = newSeasonalExitRuleMetric("code-237", "label-304");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalExitRuleMetric rejects moves from closed", () => {
  const item = newSeasonalExitRuleMetric("code-237", "label-304");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
