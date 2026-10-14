import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFlightSummaryReport } from "./global-flight-summary-report.js";
import { GlobalFlightSummary, newGlobalFlightSummary } from "./global-flight-summary.js";

test("GlobalFlightSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_371_135);
  const items: GlobalFlightSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalFlightSummary(`global-flight-summary-${index}`, "sample"));
  }
  const report = buildGlobalFlightSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
