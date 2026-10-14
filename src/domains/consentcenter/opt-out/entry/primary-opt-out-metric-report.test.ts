import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryOptOutMetricReport } from "./primary-opt-out-metric-report.js";
import { PrimaryOptOutMetric, newPrimaryOptOutMetric } from "./primary-opt-out-metric.js";

test("PrimaryOptOutMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_644_306);
  const items: PrimaryOptOutMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryOptOutMetric(`primary-opt-out-metric-${index}`, "sample"));
  }
  const report = buildPrimaryOptOutMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
