import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainReservationView, toDomainReservationViews } from "./domain-reservation-view.js";
import { newDomainReservation } from "./domain-reservation.js";

test("DomainReservationView shows the status in capitals", () => {
  const item = newDomainReservation("code-787", "name-184");
  const view = toDomainReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainReservationViews([item, item]).length, 2, "views");
});
