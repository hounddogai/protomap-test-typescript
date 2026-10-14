import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveReplyReservationView,
  toAdaptiveReplyReservationViews,
} from "./adaptive-reply-reservation-view.js";
import { newAdaptiveReplyReservation } from "./adaptive-reply-reservation.js";

test("AdaptiveReplyReservationView shows the status in capitals", () => {
  const item = newAdaptiveReplyReservation("code-441", "title-875");
  const view = toAdaptiveReplyReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveReplyReservationViews([item, item]).length, 2, "views");
});
