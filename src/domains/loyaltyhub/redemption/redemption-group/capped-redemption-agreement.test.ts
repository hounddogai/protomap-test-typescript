import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRedemptionAgreement } from "./capped-redemption-agreement.js";

test("CappedRedemptionAgreement starts in draft", () => {
  const item = newCappedRedemptionAgreement("code-326", "label-867");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRedemptionAgreement moves to pending", () => {
  const item = newCappedRedemptionAgreement("code-326", "label-867");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedRedemptionAgreement rejects moves from closed", () => {
  const item = newCappedRedemptionAgreement("code-326", "label-867");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
