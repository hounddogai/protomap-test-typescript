import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleMetric } from "./exit-rule-metric.js";

test("ExitRuleMetric starts in proposed", () => {
  const item = newExitRuleMetric("code-739", "label-312");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleMetric moves to rejected", () => {
  const item = newExitRuleMetric("code-739", "label-312");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ExitRuleMetric rejects moves from withdrawn", () => {
  const item = newExitRuleMetric("code-739", "label-312");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
