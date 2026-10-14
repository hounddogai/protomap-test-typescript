import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeReservationView, toBadgeReservationViews } from "./badge-reservation-view.js";
import { newBadgeReservation } from "./badge-reservation.js";

test("BadgeReservationView shows the status in capitals", () => {
  const item = newBadgeReservation("code-265", "label-133");
  const view = toBadgeReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeReservationViews([item, item]).length, 2, "views");
});
