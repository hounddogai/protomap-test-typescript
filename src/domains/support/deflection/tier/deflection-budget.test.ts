import assert from "node:assert/strict";
import { test } from "node:test";
import { newDeflectionBudget } from "./deflection-budget.js";

test("DeflectionBudget starts in draft", () => {
  const item = newDeflectionBudget("code-813", "label-780");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DeflectionBudget moves to pending", () => {
  const item = newDeflectionBudget("code-813", "label-780");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("DeflectionBudget rejects moves from closed", () => {
  const item = newDeflectionBudget("code-813", "label-780");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
