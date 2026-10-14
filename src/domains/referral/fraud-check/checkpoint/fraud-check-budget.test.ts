import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckBudget } from "./fraud-check-budget.js";

test("FraudCheckBudget starts in planned", () => {
  const item = newFraudCheckBudget("code-537", "label-249");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckBudget moves to scheduled", () => {
  const item = newFraudCheckBudget("code-537", "label-249");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FraudCheckBudget rejects moves from cancelled", () => {
  const item = newFraudCheckBudget("code-537", "label-249");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
