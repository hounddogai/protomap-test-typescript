import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedDeflectionReservationView,
  toBatchedDeflectionReservationViews,
} from "./batched-deflection-reservation-view.js";
import { newBatchedDeflectionReservation } from "./batched-deflection-reservation.js";

test("BatchedDeflectionReservationView shows the status in capitals", () => {
  const item = newBatchedDeflectionReservation("code-542", "label-599");
  const view = toBatchedDeflectionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedDeflectionReservationViews([item, item]).length, 2, "views");
});
