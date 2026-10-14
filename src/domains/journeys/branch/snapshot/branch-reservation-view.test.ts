import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchReservationView, toBranchReservationViews } from "./branch-reservation-view.js";
import { newBranchReservation } from "./branch-reservation.js";

test("BranchReservationView shows the status in capitals", () => {
  const item = newBranchReservation("code-273", "title-271");
  const view = toBranchReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchReservationViews([item, item]).length, 2, "views");
});
