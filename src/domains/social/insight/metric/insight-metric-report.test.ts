import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightMetricReport } from "./insight-metric-report.js";
import { InsightMetric, newInsightMetric } from "./insight-metric.js";

test("InsightMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_299_072);
  const items: InsightMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInsightMetric(`insight-metric-${index}`, "sample"));
  }
  const report = buildInsightMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
