import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalCreditReservationView,
  toSeasonalCreditReservationViews,
} from "./seasonal-credit-reservation-view.js";
import { newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

test("SeasonalCreditReservationView shows the status in capitals", () => {
  const item = newSeasonalCreditReservation("code-874", "label-759");
  const view = toSeasonalCreditReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCreditReservationViews([item, item]).length, 2, "views");
});
