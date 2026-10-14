import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintBudget } from "./complaint-budget.js";

test("ComplaintBudget starts in new", () => {
  const item = newComplaintBudget("code-303", "name-438");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintBudget moves to failed", () => {
  const item = newComplaintBudget("code-303", "name-438");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ComplaintBudget rejects moves from failed", () => {
  const item = newComplaintBudget("code-303", "name-438");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
