import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryInsightReservationReport } from "./primary-insight-reservation-report.js";
import { PrimaryInsightReservation, newPrimaryInsightReservation } from "./primary-insight-reservation.js";

test("PrimaryInsightReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_307_852);
  const items: PrimaryInsightReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryInsightReservation(`primary-insight-reservation-${index}`, "sample"));
  }
  const report = buildPrimaryInsightReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
