import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultTouchpointReservationView,
  toDefaultTouchpointReservationViews,
} from "./default-touchpoint-reservation-view.js";
import { newDefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

test("DefaultTouchpointReservationView shows the status in capitals", () => {
  const item = newDefaultTouchpointReservation("code-134", "label-564");
  const view = toDefaultTouchpointReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultTouchpointReservationViews([item, item]).length, 2, "views");
});
