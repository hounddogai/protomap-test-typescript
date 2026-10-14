import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryRedemptionSummary } from "./primary-redemption-summary.js";

test("PrimaryRedemptionSummary starts in requested", () => {
  const item = newPrimaryRedemptionSummary("code-380", "label-15");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryRedemptionSummary moves to revoked", () => {
  const item = newPrimaryRedemptionSummary("code-380", "label-15");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("PrimaryRedemptionSummary rejects moves from expired", () => {
  const item = newPrimaryRedemptionSummary("code-380", "label-15");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
