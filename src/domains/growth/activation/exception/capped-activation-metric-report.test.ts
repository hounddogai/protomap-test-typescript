import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedActivationMetricReport } from "./capped-activation-metric-report.js";
import { CappedActivationMetric, newCappedActivationMetric } from "./capped-activation-metric.js";

test("CappedActivationMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_832_963);
  const items: CappedActivationMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedActivationMetric(`capped-activation-metric-${index}`, "sample"));
  }
  const report = buildCappedActivationMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
