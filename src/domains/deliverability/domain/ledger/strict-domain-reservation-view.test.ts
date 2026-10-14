import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictDomainReservationView, toStrictDomainReservationViews } from "./strict-domain-reservation-view.js";
import { newStrictDomainReservation } from "./strict-domain-reservation.js";

test("StrictDomainReservationView shows the status in capitals", () => {
  const item = newStrictDomainReservation("code-890", "name-204");
  const view = toStrictDomainReservationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictDomainReservationViews([item, item]).length, 2, "views");
});
