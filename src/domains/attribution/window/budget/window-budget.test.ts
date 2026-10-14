import assert from "node:assert/strict";
import { test } from "node:test";
import { newWindowBudget } from "./window-budget.js";

test("WindowBudget starts in new", () => {
  const item = newWindowBudget("code-862", "name-55");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WindowBudget moves to done", () => {
  const item = newWindowBudget("code-862", "name-55");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WindowBudget rejects moves from failed", () => {
  const item = newWindowBudget("code-862", "name-55");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
