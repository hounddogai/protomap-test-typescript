import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

test("TieredExitRuleMetric starts in open", () => {
  const item = newTieredExitRuleMetric("code-896", "title-379");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredExitRuleMetric moves to reopened", () => {
  const item = newTieredExitRuleMetric("code-896", "title-379");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("TieredExitRuleMetric rejects moves from archived", () => {
  const item = newTieredExitRuleMetric("code-896", "title-379");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
