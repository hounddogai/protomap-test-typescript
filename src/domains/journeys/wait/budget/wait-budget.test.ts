import assert from "node:assert/strict";
import { test } from "node:test";
import { newWaitBudget } from "./wait-budget.js";

test("WaitBudget starts in draft", () => {
  const item = newWaitBudget("code-954", "label-677");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WaitBudget moves to pending", () => {
  const item = newWaitBudget("code-954", "label-677");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WaitBudget rejects moves from closed", () => {
  const item = newWaitBudget("code-954", "label-677");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
