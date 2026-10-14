import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathReservationView, toPathReservationViews } from "./path-reservation-view.js";
import { newPathReservation } from "./path-reservation.js";

test("PathReservationView shows the status in capitals", () => {
  const item = newPathReservation("code-559", "label-251");
  const view = toPathReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathReservationViews([item, item]).length, 2, "views");
});
