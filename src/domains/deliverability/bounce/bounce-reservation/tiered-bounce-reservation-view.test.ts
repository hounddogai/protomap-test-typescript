import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredBounceReservationView, toTieredBounceReservationViews } from "./tiered-bounce-reservation-view.js";
import { newTieredBounceReservation } from "./tiered-bounce-reservation.js";

test("TieredBounceReservationView shows the status in capitals", () => {
  const item = newTieredBounceReservation("code-137", "label-219");
  const view = toTieredBounceReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredBounceReservationViews([item, item]).length, 2, "views");
});
