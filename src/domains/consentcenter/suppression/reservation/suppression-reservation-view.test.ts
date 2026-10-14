import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionReservationView, toSuppressionReservationViews } from "./suppression-reservation-view.js";
import { newSuppressionReservation } from "./suppression-reservation.js";

test("SuppressionReservationView shows the status in capitals", () => {
  const item = newSuppressionReservation("code-86", "label-211");
  const view = toSuppressionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionReservationViews([item, item]).length, 2, "views");
});
