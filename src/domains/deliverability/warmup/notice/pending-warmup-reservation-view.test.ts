import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingWarmupReservationView,
  toPendingWarmupReservationViews,
} from "./pending-warmup-reservation-view.js";
import { newPendingWarmupReservation } from "./pending-warmup-reservation.js";

test("PendingWarmupReservationView shows the status in capitals", () => {
  const item = newPendingWarmupReservation("code-506", "title-366");
  const view = toPendingWarmupReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingWarmupReservationViews([item, item]).length, 2, "views");
});
