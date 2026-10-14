import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPlacementReservationReport } from "./tiered-placement-reservation-report.js";
import { TieredPlacementReservation, newTieredPlacementReservation } from "./tiered-placement-reservation.js";

test("TieredPlacementReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_650_080);
  const items: TieredPlacementReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredPlacementReservation(`tiered-placement-reservation-${index}`, "sample"));
  }
  const report = buildTieredPlacementReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
