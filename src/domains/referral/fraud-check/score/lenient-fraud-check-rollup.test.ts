import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

test("LenientFraudCheckRollup starts in planned", () => {
  const item = newLenientFraudCheckRollup("code-983", "label-283");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientFraudCheckRollup moves to cancelled", () => {
  const item = newLenientFraudCheckRollup("code-983", "label-283");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("LenientFraudCheckRollup rejects moves from cancelled", () => {
  const item = newLenientFraudCheckRollup("code-983", "label-283");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
