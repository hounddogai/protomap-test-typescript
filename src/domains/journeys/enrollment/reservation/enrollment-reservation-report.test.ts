import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentReservationReport } from "./enrollment-reservation-report.js";
import { EnrollmentReservation, newEnrollmentReservation } from "./enrollment-reservation.js";

test("EnrollmentReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_817_670);
  const items: EnrollmentReservation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEnrollmentReservation(`enrollment-reservation-${index}`, "sample"));
  }
  const report = buildEnrollmentReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
