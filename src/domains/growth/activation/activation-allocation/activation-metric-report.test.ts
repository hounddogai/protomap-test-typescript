import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationMetricReport } from "./activation-metric-report.js";
import { ActivationMetric, newActivationMetric } from "./activation-metric.js";

test("ActivationMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_089_268);
  const items: ActivationMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationMetric(`activation-metric-${index}`, "sample"));
  }
  const report = buildActivationMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
