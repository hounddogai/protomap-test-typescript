import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingBudget } from "./pacing-budget.js";

test("PacingBudget starts in draft", () => {
  const item = newPacingBudget("code-82", "name-728");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingBudget moves to active", () => {
  const item = newPacingBudget("code-82", "name-728");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PacingBudget rejects moves from closed", () => {
  const item = newPacingBudget("code-82", "name-728");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
