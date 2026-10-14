import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentBudget } from "./enrollment-budget.js";

test("EnrollmentBudget starts in planned", () => {
  const item = newEnrollmentBudget("code-166", "label-493");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentBudget moves to completed", () => {
  const item = newEnrollmentBudget("code-166", "label-493");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("EnrollmentBudget rejects moves from cancelled", () => {
  const item = newEnrollmentBudget("code-166", "label-493");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
