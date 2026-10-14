import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightReservationReport } from "./insight-reservation-report.js";
import { InsightReservation, newInsightReservation } from "./insight-reservation.js";

test("InsightReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_208_873);
  const items: InsightReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInsightReservation(`insight-reservation-${index}`, "sample"));
  }
  const report = buildInsightReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
