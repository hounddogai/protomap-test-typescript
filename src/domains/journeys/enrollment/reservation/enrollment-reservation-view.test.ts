import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentReservationView, toEnrollmentReservationViews } from "./enrollment-reservation-view.js";
import { newEnrollmentReservation } from "./enrollment-reservation.js";

test("EnrollmentReservationView shows the status in capitals", () => {
  const item = newEnrollmentReservation("code-340", "title-401");
  const view = toEnrollmentReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentReservationViews([item, item]).length, 2, "views");
});
