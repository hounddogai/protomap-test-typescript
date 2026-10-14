import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultRedemptionReservationView,
  toDefaultRedemptionReservationViews,
} from "./default-redemption-reservation-view.js";
import { newDefaultRedemptionReservation } from "./default-redemption-reservation.js";

test("DefaultRedemptionReservationView shows the status in capitals", () => {
  const item = newDefaultRedemptionReservation("code-576", "label-322");
  const view = toDefaultRedemptionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRedemptionReservationViews([item, item]).length, 2, "views");
});
