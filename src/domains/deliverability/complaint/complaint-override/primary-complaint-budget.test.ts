import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryComplaintBudget } from "./primary-complaint-budget.js";

test("PrimaryComplaintBudget starts in proposed", () => {
  const item = newPrimaryComplaintBudget("code-997", "name-83");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryComplaintBudget moves to approved", () => {
  const item = newPrimaryComplaintBudget("code-997", "name-83");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryComplaintBudget rejects moves from withdrawn", () => {
  const item = newPrimaryComplaintBudget("code-997", "name-83");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
