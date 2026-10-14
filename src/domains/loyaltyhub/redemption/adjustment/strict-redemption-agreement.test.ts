import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRedemptionAgreement } from "./strict-redemption-agreement.js";

test("StrictRedemptionAgreement starts in new", () => {
  const item = newStrictRedemptionAgreement("code-473", "label-289");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRedemptionAgreement moves to queued", () => {
  const item = newStrictRedemptionAgreement("code-473", "label-289");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("StrictRedemptionAgreement rejects moves from failed", () => {
  const item = newStrictRedemptionAgreement("code-473", "label-289");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
