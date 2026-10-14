import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWaitReservationView, toLegacyWaitReservationViews } from "./legacy-wait-reservation-view.js";
import { newLegacyWaitReservation } from "./legacy-wait-reservation.js";

test("LegacyWaitReservationView shows the status in capitals", () => {
  const item = newLegacyWaitReservation("code-994", "title-402");
  const view = toLegacyWaitReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWaitReservationViews([item, item]).length, 2, "views");
});
