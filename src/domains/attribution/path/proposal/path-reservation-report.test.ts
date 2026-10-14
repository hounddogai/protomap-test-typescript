import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathReservationReport } from "./path-reservation-report.js";
import { PathReservation, newPathReservation } from "./path-reservation.js";

test("PathReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_859_074);
  const items: PathReservation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathReservation(`path-reservation-${index}`, "sample"));
  }
  const report = buildPathReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
