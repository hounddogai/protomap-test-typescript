import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckEstimate } from "./fraud-check-estimate.js";

test("FraudCheckEstimate starts in planned", () => {
  const item = newFraudCheckEstimate("code-932", "name-145");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckEstimate moves to completed", () => {
  const item = newFraudCheckEstimate("code-932", "name-145");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("FraudCheckEstimate rejects moves from cancelled", () => {
  const item = newFraudCheckEstimate("code-932", "name-145");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
