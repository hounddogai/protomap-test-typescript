import assert from "node:assert/strict";
import { test } from "node:test";
import { newCohortBudget } from "./cohort-budget.js";

test("CohortBudget starts in requested", () => {
  const item = newCohortBudget("code-471", "title-362");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CohortBudget moves to revoked", () => {
  const item = newCohortBudget("code-471", "title-362");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("CohortBudget rejects moves from expired", () => {
  const item = newCohortBudget("code-471", "title-362");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
