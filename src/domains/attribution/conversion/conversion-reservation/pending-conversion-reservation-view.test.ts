import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingConversionReservationView,
  toPendingConversionReservationViews,
} from "./pending-conversion-reservation-view.js";
import { newPendingConversionReservation } from "./pending-conversion-reservation.js";

test("PendingConversionReservationView shows the status in capitals", () => {
  const item = newPendingConversionReservation("code-952", "label-725");
  const view = toPendingConversionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingConversionReservationViews([item, item]).length, 2, "views");
});
