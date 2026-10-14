import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientExitRuleBudget } from "./lenient-exit-rule-budget.js";

test("LenientExitRuleBudget starts in new", () => {
  const item = newLenientExitRuleBudget("code-261", "name-546");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientExitRuleBudget moves to failed", () => {
  const item = newLenientExitRuleBudget("code-261", "name-546");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("LenientExitRuleBudget rejects moves from failed", () => {
  const item = newLenientExitRuleBudget("code-261", "name-546");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
