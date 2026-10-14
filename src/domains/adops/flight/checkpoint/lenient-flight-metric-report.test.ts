import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientFlightMetricReport } from "./lenient-flight-metric-report.js";
import { LenientFlightMetric, newLenientFlightMetric } from "./lenient-flight-metric.js";

test("LenientFlightMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_784_993);
  const items: LenientFlightMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientFlightMetric(`lenient-flight-metric-${index}`, "sample"));
  }
  const report = buildLenientFlightMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
