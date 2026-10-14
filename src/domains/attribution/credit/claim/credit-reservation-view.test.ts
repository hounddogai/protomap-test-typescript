import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditReservationView, toCreditReservationViews } from "./credit-reservation-view.js";
import { newCreditReservation } from "./credit-reservation.js";

test("CreditReservationView shows the status in capitals", () => {
  const item = newCreditReservation("code-353", "title-308");
  const view = toCreditReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditReservationViews([item, item]).length, 2, "views");
});
