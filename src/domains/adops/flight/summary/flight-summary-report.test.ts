import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightSummaryReport } from "./flight-summary-report.js";
import { FlightSummary, newFlightSummary } from "./flight-summary.js";

test("FlightSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_116_442);
  const items: FlightSummary[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFlightSummary(`flight-summary-${index}`, "sample"));
  }
  const report = buildFlightSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
