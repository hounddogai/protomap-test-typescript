import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutTier } from "./payout-tier.js";

test("PayoutTier starts in open", () => {
  const item = newPayoutTier("code-26", "label-221");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutTier moves to resolved", () => {
  const item = newPayoutTier("code-26", "label-221");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PayoutTier rejects moves from archived", () => {
  const item = newPayoutTier("code-26", "label-221");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
