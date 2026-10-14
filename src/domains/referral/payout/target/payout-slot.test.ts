import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutSlot } from "./payout-slot.js";

test("PayoutSlot starts in new", () => {
  const item = newPayoutSlot("code-555", "label-452");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutSlot moves to running", () => {
  const item = newPayoutSlot("code-555", "label-452");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PayoutSlot rejects moves from failed", () => {
  const item = newPayoutSlot("code-555", "label-452");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
