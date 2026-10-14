import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSenderReservationView,
  toFallbackSenderReservationViews,
} from "./fallback-sender-reservation-view.js";
import { newFallbackSenderReservation } from "./fallback-sender-reservation.js";

test("FallbackSenderReservationView shows the status in capitals", () => {
  const item = newFallbackSenderReservation("code-583", "title-531");
  const view = toFallbackSenderReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSenderReservationViews([item, item]).length, 2, "views");
});
