import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualDeflectionReservationView,
  toManualDeflectionReservationViews,
} from "./manual-deflection-reservation-view.js";
import { newManualDeflectionReservation } from "./manual-deflection-reservation.js";

test("ManualDeflectionReservationView shows the status in capitals", () => {
  const item = newManualDeflectionReservation("code-799", "title-340");
  const view = toManualDeflectionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualDeflectionReservationViews([item, item]).length, 2, "views");
});
