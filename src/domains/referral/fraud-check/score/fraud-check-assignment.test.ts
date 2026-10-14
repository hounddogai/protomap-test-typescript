import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckAssignment } from "./fraud-check-assignment.js";

test("FraudCheckAssignment starts in planned", () => {
  const item = newFraudCheckAssignment("code-648", "title-850");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckAssignment moves to cancelled", () => {
  const item = newFraudCheckAssignment("code-648", "title-850");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("FraudCheckAssignment rejects moves from cancelled", () => {
  const item = newFraudCheckAssignment("code-648", "title-850");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
