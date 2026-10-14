import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInReservationReport } from "./double-opt-in-reservation-report.js";
import { DoubleOptInReservation, newDoubleOptInReservation } from "./double-opt-in-reservation.js";

test("DoubleOptInReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_638_216);
  const items: DoubleOptInReservation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInReservation(`double-opt-in-reservation-${index}`, "sample"));
  }
  const report = buildDoubleOptInReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
