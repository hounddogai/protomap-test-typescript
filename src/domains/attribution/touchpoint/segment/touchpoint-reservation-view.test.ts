import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointReservationView, toTouchpointReservationViews } from "./touchpoint-reservation-view.js";
import { newTouchpointReservation } from "./touchpoint-reservation.js";

test("TouchpointReservationView shows the status in capitals", () => {
  const item = newTouchpointReservation("code-391", "name-852");
  const view = toTouchpointReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointReservationViews([item, item]).length, 2, "views");
});
