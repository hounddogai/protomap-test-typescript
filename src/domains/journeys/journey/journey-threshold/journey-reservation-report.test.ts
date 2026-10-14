import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyReservationReport } from "./journey-reservation-report.js";
import { JourneyReservation, newJourneyReservation } from "./journey-reservation.js";

test("JourneyReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_586_460);
  const items: JourneyReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newJourneyReservation(`journey-reservation-${index}`, "sample"));
  }
  const report = buildJourneyReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
