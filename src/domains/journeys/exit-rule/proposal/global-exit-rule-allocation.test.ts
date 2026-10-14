import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

test("GlobalExitRuleAllocation starts in open", () => {
  const item = newGlobalExitRuleAllocation("code-892", "label-9");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalExitRuleAllocation moves to in review", () => {
  const item = newGlobalExitRuleAllocation("code-892", "label-9");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalExitRuleAllocation rejects moves from archived", () => {
  const item = newGlobalExitRuleAllocation("code-892", "label-9");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
