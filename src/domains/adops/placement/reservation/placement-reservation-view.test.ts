import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementReservationView, toPlacementReservationViews } from "./placement-reservation-view.js";
import { newPlacementReservation } from "./placement-reservation.js";

test("PlacementReservationView shows the status in capitals", () => {
  const item = newPlacementReservation("code-709", "label-338");
  const view = toPlacementReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementReservationViews([item, item]).length, 2, "views");
});
