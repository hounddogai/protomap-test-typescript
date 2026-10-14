import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedComplaintReservationView,
  toWeightedComplaintReservationViews,
} from "./weighted-complaint-reservation-view.js";
import { newWeightedComplaintReservation } from "./weighted-complaint-reservation.js";

test("WeightedComplaintReservationView shows the status in capitals", () => {
  const item = newWeightedComplaintReservation("code-303", "name-771");
  const view = toWeightedComplaintReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedComplaintReservationViews([item, item]).length, 2, "views");
});
