import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionAgreement } from "./redemption-agreement.js";

test("RedemptionAgreement starts in new", () => {
  const item = newRedemptionAgreement("code-115", "label-735");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionAgreement moves to running", () => {
  const item = newRedemptionAgreement("code-115", "label-735");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RedemptionAgreement rejects moves from failed", () => {
  const item = newRedemptionAgreement("code-115", "label-735");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
