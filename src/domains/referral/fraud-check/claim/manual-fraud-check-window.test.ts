import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFraudCheckWindow } from "./manual-fraud-check-window.js";

test("ManualFraudCheckWindow starts in planned", () => {
  const item = newManualFraudCheckWindow("code-130", "label-453");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFraudCheckWindow moves to completed", () => {
  const item = newManualFraudCheckWindow("code-130", "label-453");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ManualFraudCheckWindow rejects moves from cancelled", () => {
  const item = newManualFraudCheckWindow("code-130", "label-453");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
