import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("LenientSuppressionAgreement starts in planned", () => {
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientSuppressionAgreement moves to scheduled", () => {
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientSuppressionAgreement rejects moves from cancelled", () => {
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
