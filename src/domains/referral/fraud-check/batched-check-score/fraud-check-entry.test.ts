import assert from "node:assert/strict";
import { test } from "node:test";
import { newFraudCheckEntry } from "./fraud-check-entry.js";

test("FraudCheckEntry starts in planned", () => {
  const item = newFraudCheckEntry("code-58", "label-308");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FraudCheckEntry moves to scheduled", () => {
  const item = newFraudCheckEntry("code-58", "label-308");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("FraudCheckEntry rejects moves from cancelled", () => {
  const item = newFraudCheckEntry("code-58", "label-308");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
