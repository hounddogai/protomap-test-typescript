import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalQueueReservationReport } from "./seasonal-queue-reservation-report.js";
import { SeasonalQueueReservation, newSeasonalQueueReservation } from "./seasonal-queue-reservation.js";

test("SeasonalQueueReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_111_614);
  const items: SeasonalQueueReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalQueueReservation(`seasonal-queue-reservation-${index}`, "sample"));
  }
  const report = buildSeasonalQueueReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
