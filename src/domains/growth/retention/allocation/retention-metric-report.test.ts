import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionMetricReport } from "./retention-metric-report.js";
import { RetentionMetric, newRetentionMetric } from "./retention-metric.js";

test("RetentionMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_881_256);
  const items: RetentionMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRetentionMetric(`retention-metric-${index}`, "sample"));
  }
  const report = buildRetentionMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
