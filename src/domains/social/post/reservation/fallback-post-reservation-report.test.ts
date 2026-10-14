import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPostReservationReport } from "./fallback-post-reservation-report.js";
import { FallbackPostReservation, newFallbackPostReservation } from "./fallback-post-reservation.js";

test("FallbackPostReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_349_651);
  const items: FallbackPostReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackPostReservation(`fallback-post-reservation-${index}`, "sample"));
  }
  const report = buildFallbackPostReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
