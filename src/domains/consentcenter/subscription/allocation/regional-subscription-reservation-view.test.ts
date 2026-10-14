import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSubscriptionReservationView,
  toRegionalSubscriptionReservationViews,
} from "./regional-subscription-reservation-view.js";
import { newRegionalSubscriptionReservation } from "./regional-subscription-reservation.js";

test("RegionalSubscriptionReservationView shows the status in capitals", () => {
  const item = newRegionalSubscriptionReservation("code-113", "title-29");
  const view = toRegionalSubscriptionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSubscriptionReservationViews([item, item]).length, 2, "views");
});
