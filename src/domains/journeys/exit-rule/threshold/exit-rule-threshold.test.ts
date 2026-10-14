import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleThreshold } from "./exit-rule-threshold.js";

test("ExitRuleThreshold starts in planned", () => {
  const item = newExitRuleThreshold("code-235", "name-76");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleThreshold moves to cancelled", () => {
  const item = newExitRuleThreshold("code-235", "name-76");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ExitRuleThreshold rejects moves from cancelled", () => {
  const item = newExitRuleThreshold("code-235", "name-76");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
