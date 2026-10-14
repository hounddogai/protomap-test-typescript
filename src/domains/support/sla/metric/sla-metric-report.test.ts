import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaMetricReport } from "./sla-metric-report.js";
import { SlaMetric, newSlaMetric } from "./sla-metric.js";

test("SlaMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_970_174);
  const items: SlaMetric[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSlaMetric(`sla-metric-${index}`, "sample"));
  }
  const report = buildSlaMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
