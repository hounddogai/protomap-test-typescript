import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryProofBudget } from "./primary-proof-budget.js";

test("PrimaryProofBudget starts in proposed", () => {
  const item = newPrimaryProofBudget("code-432", "name-706");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryProofBudget moves to rejected", () => {
  const item = newPrimaryProofBudget("code-432", "name-706");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryProofBudget rejects moves from withdrawn", () => {
  const item = newPrimaryProofBudget("code-432", "name-706");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
