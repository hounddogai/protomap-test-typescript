import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientRedemptionTier } from "./lenient-redemption-tier.js";

test("LenientRedemptionTier starts in new", () => {
  const item = newLenientRedemptionTier("code-490", "name-634");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientRedemptionTier moves to running", () => {
  const item = newLenientRedemptionTier("code-490", "name-634");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientRedemptionTier rejects moves from failed", () => {
  const item = newLenientRedemptionTier("code-490", "name-634");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
