import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreditAgreement } from "./manual-credit-agreement.js";

test("ManualCreditAgreement starts in planned", () => {
  const item = newManualCreditAgreement("code-82", "title-336");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreditAgreement moves to in progress", () => {
  const item = newManualCreditAgreement("code-82", "title-336");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualCreditAgreement rejects moves from cancelled", () => {
  const item = newManualCreditAgreement("code-82", "title-336");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
