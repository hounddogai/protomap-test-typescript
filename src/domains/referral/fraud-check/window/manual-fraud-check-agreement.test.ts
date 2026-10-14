import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualFraudCheckAgreement } from "./manual-fraud-check-agreement.js";

test("ManualFraudCheckAgreement starts in planned", () => {
  const item = newManualFraudCheckAgreement("code-606", "label-451");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualFraudCheckAgreement moves to scheduled", () => {
  const item = newManualFraudCheckAgreement("code-606", "label-451");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ManualFraudCheckAgreement rejects moves from cancelled", () => {
  const item = newManualFraudCheckAgreement("code-606", "label-451");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
