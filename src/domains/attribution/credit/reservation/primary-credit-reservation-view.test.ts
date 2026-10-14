import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryCreditReservationView,
  toPrimaryCreditReservationViews,
} from "./primary-credit-reservation-view.js";
import { newPrimaryCreditReservation } from "./primary-credit-reservation.js";

test("PrimaryCreditReservationView shows the status in capitals", () => {
  const item = newPrimaryCreditReservation("code-378", "name-234");
  const view = toPrimaryCreditReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryCreditReservationViews([item, item]).length, 2, "views");
});
