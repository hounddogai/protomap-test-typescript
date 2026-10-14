import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

test("ScheduledPayoutReservation starts in open", () => {
  const item = newScheduledPayoutReservation("code-380", "label-14");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPayoutReservation moves to resolved", () => {
  const item = newScheduledPayoutReservation("code-380", "label-14");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ScheduledPayoutReservation rejects moves from archived", () => {
  const item = newScheduledPayoutReservation("code-380", "label-14");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
