import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredEscalationReservationView,
  toTieredEscalationReservationViews,
} from "./tiered-escalation-reservation-view.js";
import { newTieredEscalationReservation } from "./tiered-escalation-reservation.js";

test("TieredEscalationReservationView shows the status in capitals", () => {
  const item = newTieredEscalationReservation("code-177", "label-841");
  const view = toTieredEscalationReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredEscalationReservationViews([item, item]).length, 2, "views");
});
