import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

test("AdaptivePayoutAgreement starts in draft", () => {
  const item = newAdaptivePayoutAgreement("code-463", "title-551");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptivePayoutAgreement moves to active", () => {
  const item = newAdaptivePayoutAgreement("code-463", "title-551");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("AdaptivePayoutAgreement rejects moves from closed", () => {
  const item = newAdaptivePayoutAgreement("code-463", "title-551");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
