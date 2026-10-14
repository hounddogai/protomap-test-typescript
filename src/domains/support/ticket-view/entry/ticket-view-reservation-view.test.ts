import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewReservationView, toTicketViewReservationViews } from "./ticket-view-reservation-view.js";
import { newTicketViewReservation } from "./ticket-view-reservation.js";

test("TicketViewReservationView shows the status in capitals", () => {
  const item = newTicketViewReservation("code-471", "label-413");
  const view = toTicketViewReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewReservationViews([item, item]).length, 2, "views");
});
