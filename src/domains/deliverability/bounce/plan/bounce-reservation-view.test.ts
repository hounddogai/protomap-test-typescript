import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceReservationView, toBounceReservationViews } from "./bounce-reservation-view.js";
import { newBounceReservation } from "./bounce-reservation.js";

test("BounceReservationView shows the status in capitals", () => {
  const item = newBounceReservation("code-516", "title-376");
  const view = toBounceReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceReservationViews([item, item]).length, 2, "views");
});
