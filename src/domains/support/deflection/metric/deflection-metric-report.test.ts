import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionMetricReport } from "./deflection-metric-report.js";
import { DeflectionMetric, newDeflectionMetric } from "./deflection-metric.js";

test("DeflectionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_351_818);
  const items: DeflectionMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDeflectionMetric(`deflection-metric-${index}`, "sample"));
  }
  const report = buildDeflectionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
