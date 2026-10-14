import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledConversionReservationView,
  toScheduledConversionReservationViews,
} from "./scheduled-conversion-reservation-view.js";
import { newScheduledConversionReservation } from "./scheduled-conversion-reservation.js";

test("ScheduledConversionReservationView shows the status in capitals", () => {
  const item = newScheduledConversionReservation("code-326", "label-21");
  const view = toScheduledConversionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledConversionReservationViews([item, item]).length, 2, "views");
});
