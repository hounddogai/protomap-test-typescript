import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatMetricReport } from "./csat-metric-report.js";
import { CsatMetric, newCsatMetric } from "./csat-metric.js";

test("CsatMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_173_498);
  const items: CsatMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCsatMetric(`csat-metric-${index}`, "sample"));
  }
  const report = buildCsatMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
