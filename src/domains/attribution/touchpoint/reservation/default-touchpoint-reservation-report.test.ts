import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultTouchpointReservationReport } from "./default-touchpoint-reservation-report.js";
import { DefaultTouchpointReservation, newDefaultTouchpointReservation } from "./default-touchpoint-reservation.js";

test("DefaultTouchpointReservationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_732_765);
  const items: DefaultTouchpointReservation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultTouchpointReservation(`default-touchpoint-reservation-${index}`, "sample"));
  }
  const report = buildDefaultTouchpointReservationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
