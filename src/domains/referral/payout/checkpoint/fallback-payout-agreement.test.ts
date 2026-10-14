import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPayoutAgreement } from "./fallback-payout-agreement.js";

test("FallbackPayoutAgreement starts in draft", () => {
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPayoutAgreement moves to suspended", () => {
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("FallbackPayoutAgreement rejects moves from closed", () => {
  const item = newFallbackPayoutAgreement("code-865", "label-953");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
