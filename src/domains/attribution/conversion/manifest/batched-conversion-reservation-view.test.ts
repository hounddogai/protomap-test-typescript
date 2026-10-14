import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedConversionReservationView,
  toBatchedConversionReservationViews,
} from "./batched-conversion-reservation-view.js";
import { newBatchedConversionReservation } from "./batched-conversion-reservation.js";

test("BatchedConversionReservationView shows the status in capitals", () => {
  const item = newBatchedConversionReservation("code-74", "title-765");
  const view = toBatchedConversionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedConversionReservationViews([item, item]).length, 2, "views");
});
