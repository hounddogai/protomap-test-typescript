import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeMetricReport } from "./creative-metric-report.js";
import { CreativeMetric, newCreativeMetric } from "./creative-metric.js";

test("CreativeMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_682_419);
  const items: CreativeMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCreativeMetric(`creative-metric-${index}`, "sample"));
  }
  const report = buildCreativeMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
