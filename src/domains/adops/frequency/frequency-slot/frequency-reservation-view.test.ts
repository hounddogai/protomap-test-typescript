import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyReservationView, toFrequencyReservationViews } from "./frequency-reservation-view.js";
import { newFrequencyReservation } from "./frequency-reservation.js";

test("FrequencyReservationView shows the status in capitals", () => {
  const item = newFrequencyReservation("code-598", "name-880");
  const view = toFrequencyReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyReservationViews([item, item]).length, 2, "views");
});
