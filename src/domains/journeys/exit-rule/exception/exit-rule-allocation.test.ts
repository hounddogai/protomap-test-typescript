import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleAllocation } from "./exit-rule-allocation.js";

test("ExitRuleAllocation starts in open", () => {
  const item = newExitRuleAllocation("code-760", "title-895");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleAllocation moves to resolved", () => {
  const item = newExitRuleAllocation("code-760", "title-895");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ExitRuleAllocation rejects moves from archived", () => {
  const item = newExitRuleAllocation("code-760", "title-895");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
