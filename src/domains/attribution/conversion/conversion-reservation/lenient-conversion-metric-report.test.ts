import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientConversionMetricReport } from "./lenient-conversion-metric-report.js";
import { LenientConversionMetric, newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("LenientConversionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_636_251);
  const items: LenientConversionMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientConversionMetric(`lenient-conversion-metric-${index}`, "sample"));
  }
  const report = buildLenientConversionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
