import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowReservationView, toWindowReservationViews } from "./window-reservation-view.js";
import { newWindowReservation } from "./window-reservation.js";

test("WindowReservationView shows the status in capitals", () => {
  const item = newWindowReservation("code-452", "label-514");
  const view = toWindowReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowReservationViews([item, item]).length, 2, "views");
});
