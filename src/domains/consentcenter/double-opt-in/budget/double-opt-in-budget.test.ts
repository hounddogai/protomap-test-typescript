import assert from "node:assert/strict";
import { test } from "node:test";
import { newDoubleOptInBudget } from "./double-opt-in-budget.js";

test("DoubleOptInBudget starts in created", () => {
  const item = newDoubleOptInBudget("code-18", "title-252");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DoubleOptInBudget moves to validated", () => {
  const item = newDoubleOptInBudget("code-18", "title-252");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DoubleOptInBudget rejects moves from retired", () => {
  const item = newDoubleOptInBudget("code-18", "title-252");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
