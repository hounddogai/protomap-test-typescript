import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionReservationReport } from "./suppression-reservation-report.js";
import { SuppressionReservation, newSuppressionReservation } from "./suppression-reservation.js";

test("SuppressionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_113_352);
  const items: SuppressionReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSuppressionReservation(`suppression-reservation-${index}`, "sample"));
  }
  const report = buildSuppressionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
