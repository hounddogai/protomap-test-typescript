import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSenderMetricReport } from "./fallback-sender-metric-report.js";
import { FallbackSenderMetric, newFallbackSenderMetric } from "./fallback-sender-metric.js";

test("FallbackSenderMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_214_370);
  const items: FallbackSenderMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackSenderMetric(`fallback-sender-metric-${index}`, "sample"));
  }
  const report = buildFallbackSenderMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
