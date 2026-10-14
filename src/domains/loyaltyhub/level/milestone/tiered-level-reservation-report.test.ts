import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredLevelReservationReport } from "./tiered-level-reservation-report.js";
import { TieredLevelReservation, newTieredLevelReservation } from "./tiered-level-reservation.js";

test("TieredLevelReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_604_256);
  const items: TieredLevelReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredLevelReservation(`tiered-level-reservation-${index}`, "sample"));
  }
  const report = buildTieredLevelReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
