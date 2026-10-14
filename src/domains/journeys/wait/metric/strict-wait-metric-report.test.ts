import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictWaitMetricReport } from "./strict-wait-metric-report.js";
import { StrictWaitMetric, newStrictWaitMetric } from "./strict-wait-metric.js";

test("StrictWaitMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_671_231);
  const items: StrictWaitMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictWaitMetric(`strict-wait-metric-${index}`, "sample"));
  }
  const report = buildStrictWaitMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
