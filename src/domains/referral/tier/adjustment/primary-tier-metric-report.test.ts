import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryTierMetricReport } from "./primary-tier-metric-report.js";
import { PrimaryTierMetric, newPrimaryTierMetric } from "./primary-tier-metric.js";

test("PrimaryTierMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_669_077);
  const items: PrimaryTierMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryTierMetric(`primary-tier-metric-${index}`, "sample"));
  }
  const report = buildPrimaryTierMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
