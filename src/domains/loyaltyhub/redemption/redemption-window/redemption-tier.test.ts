import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionTier } from "./redemption-tier.js";

test("RedemptionTier starts in requested", () => {
  const item = newRedemptionTier("code-988", "label-237");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionTier moves to granted", () => {
  const item = newRedemptionTier("code-988", "label-237");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RedemptionTier rejects moves from expired", () => {
  const item = newRedemptionTier("code-988", "label-237");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
