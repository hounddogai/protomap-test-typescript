import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutReservationView, toPayoutReservationViews } from "./payout-reservation-view.js";
import { newPayoutReservation } from "./payout-reservation.js";

test("PayoutReservationView shows the status in capitals", () => {
  const item = newPayoutReservation("code-238", "title-237");
  const view = toPayoutReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutReservationViews([item, item]).length, 2, "views");
});
