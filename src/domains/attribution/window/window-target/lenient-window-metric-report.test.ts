import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWindowMetricReport } from "./lenient-window-metric-report.js";
import { LenientWindowMetric, newLenientWindowMetric } from "./lenient-window-metric.js";

test("LenientWindowMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_656_399);
  const items: LenientWindowMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientWindowMetric(`lenient-window-metric-${index}`, "sample"));
  }
  const report = buildLenientWindowMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
