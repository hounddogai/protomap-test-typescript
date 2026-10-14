import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionReservationView, toConversionReservationViews } from "./conversion-reservation-view.js";
import { newConversionReservation } from "./conversion-reservation.js";

test("ConversionReservationView shows the status in capitals", () => {
  const item = newConversionReservation("code-344", "name-620");
  const view = toConversionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionReservationViews([item, item]).length, 2, "views");
});
