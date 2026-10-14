import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyConversionMetricReport } from "./legacy-conversion-metric-report.js";
import { LegacyConversionMetric, newLegacyConversionMetric } from "./legacy-conversion-metric.js";

test("LegacyConversionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_457_990);
  const items: LegacyConversionMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyConversionMetric(`legacy-conversion-metric-${index}`, "sample"));
  }
  const report = buildLegacyConversionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
