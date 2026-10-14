import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientActivationMetricReport } from "./lenient-activation-metric-report.js";
import { LenientActivationMetric, newLenientActivationMetric } from "./lenient-activation-metric.js";

test("LenientActivationMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_451_859);
  const items: LenientActivationMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientActivationMetric(`lenient-activation-metric-${index}`, "sample"));
  }
  const report = buildLenientActivationMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
