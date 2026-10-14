import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaReservationReport } from "./sla-reservation-report.js";
import { SlaReservation, newSlaReservation } from "./sla-reservation.js";

test("SlaReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_181_808);
  const items: SlaReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSlaReservation(`sla-reservation-${index}`, "sample"));
  }
  const report = buildSlaReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
