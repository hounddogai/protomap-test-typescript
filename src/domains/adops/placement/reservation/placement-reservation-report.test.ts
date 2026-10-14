import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementReservationReport } from "./placement-reservation-report.js";
import { PlacementReservation, newPlacementReservation } from "./placement-reservation.js";

test("PlacementReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_452_656);
  const items: PlacementReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPlacementReservation(`placement-reservation-${index}`, "sample"));
  }
  const report = buildPlacementReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
