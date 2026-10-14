import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofBudget } from "./proof-budget.js";

test("ProofBudget starts in open", () => {
  const item = newProofBudget("code-712", "name-556");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofBudget moves to archived", () => {
  const item = newProofBudget("code-712", "name-556");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("ProofBudget rejects moves from archived", () => {
  const item = newProofBudget("code-712", "name-556");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
