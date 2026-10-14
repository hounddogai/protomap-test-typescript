import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalReservationView, toApprovalReservationViews } from "./approval-reservation-view.js";
import { newApprovalReservation } from "./approval-reservation.js";

test("ApprovalReservationView shows the status in capitals", () => {
  const item = newApprovalReservation("code-509", "title-530");
  const view = toApprovalReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalReservationViews([item, item]).length, 2, "views");
});
