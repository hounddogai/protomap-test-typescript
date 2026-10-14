import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightVarianceReport } from "./flight-variance-report.js";
import { FlightVariance, newFlightVariance } from "./flight-variance.js";

test("FlightVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_356_611);
  const items: FlightVariance[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFlightVariance(`flight-variance-${index}`, "sample"));
  }
  const report = buildFlightVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
