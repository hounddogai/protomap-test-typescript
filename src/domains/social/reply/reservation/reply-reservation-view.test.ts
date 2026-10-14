import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyReservationView, toReplyReservationViews } from "./reply-reservation-view.js";
import { newReplyReservation } from "./reply-reservation.js";

test("ReplyReservationView shows the status in capitals", () => {
  const item = newReplyReservation("code-619", "name-82");
  const view = toReplyReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyReservationViews([item, item]).length, 2, "views");
});
