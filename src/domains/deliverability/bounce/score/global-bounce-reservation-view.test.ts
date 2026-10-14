import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBounceReservationView, toGlobalBounceReservationViews } from "./global-bounce-reservation-view.js";
import { newGlobalBounceReservation } from "./global-bounce-reservation.js";

test("GlobalBounceReservationView shows the status in capitals", () => {
  const item = newGlobalBounceReservation("code-902", "label-374");
  const view = toGlobalBounceReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBounceReservationViews([item, item]).length, 2, "views");
});
