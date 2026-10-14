import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionMetricReport } from "./conversion-metric-report.js";
import { ConversionMetric, newConversionMetric } from "./conversion-metric.js";

test("ConversionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_785_063);
  const items: ConversionMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newConversionMetric(`conversion-metric-${index}`, "sample"));
  }
  const report = buildConversionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
