import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryInviteReservationView,
  toPrimaryInviteReservationViews,
} from "./primary-invite-reservation-view.js";
import { newPrimaryInviteReservation } from "./primary-invite-reservation.js";

test("PrimaryInviteReservationView shows the status in capitals", () => {
  const item = newPrimaryInviteReservation("code-451", "name-783");
  const view = toPrimaryInviteReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryInviteReservationViews([item, item]).length, 2, "views");
});
