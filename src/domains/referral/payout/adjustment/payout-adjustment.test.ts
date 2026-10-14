import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutAdjustment } from "./payout-adjustment.js";

test("PayoutAdjustment starts in planned", () => {
  const item = newPayoutAdjustment("code-923", "name-954");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutAdjustment moves to cancelled", () => {
  const item = newPayoutAdjustment("code-923", "name-954");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PayoutAdjustment rejects moves from cancelled", () => {
  const item = newPayoutAdjustment("code-923", "name-954");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
