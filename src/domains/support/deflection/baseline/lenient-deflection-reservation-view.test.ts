import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientDeflectionReservationView,
  toLenientDeflectionReservationViews,
} from "./lenient-deflection-reservation-view.js";
import { newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

test("LenientDeflectionReservationView shows the status in capitals", () => {
  const item = newLenientDeflectionReservation("code-427", "label-967");
  const view = toLenientDeflectionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDeflectionReservationViews([item, item]).length, 2, "views");
});
