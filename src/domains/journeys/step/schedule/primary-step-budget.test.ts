import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryStepBudget } from "./primary-step-budget.js";

test("PrimaryStepBudget starts in requested", () => {
  const item = newPrimaryStepBudget("code-72", "label-885");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryStepBudget moves to granted", () => {
  const item = newPrimaryStepBudget("code-72", "label-885");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryStepBudget rejects moves from expired", () => {
  const item = newPrimaryStepBudget("code-72", "label-885");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
