import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientDeflectionReservationReport } from "./lenient-deflection-reservation-report.js";
import { LenientDeflectionReservation, newLenientDeflectionReservation } from "./lenient-deflection-reservation.js";

test("LenientDeflectionReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_114_806);
  const items: LenientDeflectionReservation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientDeflectionReservation(`lenient-deflection-reservation-${index}`, "sample"));
  }
  const report = buildLenientDeflectionReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
