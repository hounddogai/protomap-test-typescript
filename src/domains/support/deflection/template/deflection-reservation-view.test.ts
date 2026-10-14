import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionReservationView, toDeflectionReservationViews } from "./deflection-reservation-view.js";
import { newDeflectionReservation } from "./deflection-reservation.js";

test("DeflectionReservationView shows the status in capitals", () => {
  const item = newDeflectionReservation("code-671", "label-397");
  const view = toDeflectionReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionReservationViews([item, item]).length, 2, "views");
});
