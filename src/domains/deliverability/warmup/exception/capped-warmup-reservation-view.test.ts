import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedWarmupReservationView, toCappedWarmupReservationViews } from "./capped-warmup-reservation-view.js";
import { newCappedWarmupReservation } from "./capped-warmup-reservation.js";

test("CappedWarmupReservationView shows the status in capitals", () => {
  const item = newCappedWarmupReservation("code-746", "name-824");
  const view = toCappedWarmupReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedWarmupReservationViews([item, item]).length, 2, "views");
});
