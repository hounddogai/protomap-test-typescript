import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackFraudCheckMetricReport } from "./fallback-fraud-check-metric-report.js";
import { FallbackFraudCheckMetric, newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

test("FallbackFraudCheckMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_828_557);
  const items: FallbackFraudCheckMetric[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackFraudCheckMetric(`fallback-fraud-check-metric-${index}`, "sample"));
  }
  const report = buildFallbackFraudCheckMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
