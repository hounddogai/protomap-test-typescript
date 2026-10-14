import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceReservationReport } from "./bounce-reservation-report.js";
import { BounceReservation, newBounceReservation } from "./bounce-reservation.js";

test("BounceReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_384_336);
  const items: BounceReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBounceReservation(`bounce-reservation-${index}`, "sample"));
  }
  const report = buildBounceReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
