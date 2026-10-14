import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyPayoutReservation } from "./legacy-payout-reservation.js";

test("LegacyPayoutReservation starts in planned", () => {
  const item = newLegacyPayoutReservation("code-985", "label-158");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyPayoutReservation moves to in progress", () => {
  const item = newLegacyPayoutReservation("code-985", "label-158");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LegacyPayoutReservation rejects moves from cancelled", () => {
  const item = newLegacyPayoutReservation("code-985", "label-158");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
