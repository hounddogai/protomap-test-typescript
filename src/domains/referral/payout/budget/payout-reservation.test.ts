import assert from "node:assert/strict";
import { test } from "node:test";
import { newPayoutReservation } from "./payout-reservation.js";

test("PayoutReservation starts in draft", () => {
  const item = newPayoutReservation("code-238", "title-237");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PayoutReservation moves to closed", () => {
  const item = newPayoutReservation("code-238", "title-237");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("PayoutReservation rejects moves from closed", () => {
  const item = newPayoutReservation("code-238", "title-237");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
