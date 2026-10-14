import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceMetricReport } from "./bounce-metric-report.js";
import { BounceMetric, newBounceMetric } from "./bounce-metric.js";

test("BounceMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_855_592);
  const items: BounceMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBounceMetric(`bounce-metric-${index}`, "sample"));
  }
  const report = buildBounceMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
