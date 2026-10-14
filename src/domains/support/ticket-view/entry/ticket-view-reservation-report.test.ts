import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewReservationReport } from "./ticket-view-reservation-report.js";
import { TicketViewReservation, newTicketViewReservation } from "./ticket-view-reservation.js";

test("TicketViewReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_410_452);
  const items: TicketViewReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewReservation(`ticket-view-reservation-${index}`, "sample"));
  }
  const report = buildTicketViewReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
