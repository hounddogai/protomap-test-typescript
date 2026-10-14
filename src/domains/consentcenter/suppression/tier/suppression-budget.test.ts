import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionBudget } from "./suppression-budget.js";

test("SuppressionBudget starts in open", () => {
  const item = newSuppressionBudget("code-81", "label-358");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionBudget moves to in review", () => {
  const item = newSuppressionBudget("code-81", "label-358");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("SuppressionBudget rejects moves from archived", () => {
  const item = newSuppressionBudget("code-81", "label-358");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
