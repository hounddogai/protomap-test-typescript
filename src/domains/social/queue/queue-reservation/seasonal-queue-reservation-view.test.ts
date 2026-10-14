import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalQueueReservationView,
  toSeasonalQueueReservationViews,
} from "./seasonal-queue-reservation-view.js";
import { newSeasonalQueueReservation } from "./seasonal-queue-reservation.js";

test("SeasonalQueueReservationView shows the status in capitals", () => {
  const item = newSeasonalQueueReservation("code-876", "label-537");
  const view = toSeasonalQueueReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalQueueReservationViews([item, item]).length, 2, "views");
});
