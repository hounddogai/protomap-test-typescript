import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingCohortBudget } from "./pending-cohort-budget.js";

test("PendingCohortBudget starts in created", () => {
  const item = newPendingCohortBudget("code-700", "name-99");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingCohortBudget moves to published", () => {
  const item = newPendingCohortBudget("code-700", "name-99");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PendingCohortBudget rejects moves from retired", () => {
  const item = newPendingCohortBudget("code-700", "name-99");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
