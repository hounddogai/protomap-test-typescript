import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackReputationReservationView,
  toFallbackReputationReservationViews,
} from "./fallback-reputation-reservation-view.js";
import { newFallbackReputationReservation } from "./fallback-reputation-reservation.js";

test("FallbackReputationReservationView shows the status in capitals", () => {
  const item = newFallbackReputationReservation("code-709", "title-154");
  const view = toFallbackReputationReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackReputationReservationViews([item, item]).length, 2, "views");
});
