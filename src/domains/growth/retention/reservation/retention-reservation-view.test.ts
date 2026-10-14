import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetentionReservationView, toRetentionReservationViews } from "./retention-reservation-view.js";
import { newRetentionReservation } from "./retention-reservation.js";

test("RetentionReservationView shows the status in capitals", () => {
  const item = newRetentionReservation("code-215", "name-584");
  const view = toRetentionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRetentionReservationViews([item, item]).length, 2, "views");
});
