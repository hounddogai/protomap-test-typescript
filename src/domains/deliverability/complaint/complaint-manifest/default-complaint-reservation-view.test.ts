import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultComplaintReservationView,
  toDefaultComplaintReservationViews,
} from "./default-complaint-reservation-view.js";
import { newDefaultComplaintReservation } from "./default-complaint-reservation.js";

test("DefaultComplaintReservationView shows the status in capitals", () => {
  const item = newDefaultComplaintReservation("code-83", "title-137");
  const view = toDefaultComplaintReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultComplaintReservationViews([item, item]).length, 2, "views");
});
