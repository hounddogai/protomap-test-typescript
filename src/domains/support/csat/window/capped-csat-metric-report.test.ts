import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedCsatMetricReport } from "./capped-csat-metric-report.js";
import { CappedCsatMetric, newCappedCsatMetric } from "./capped-csat-metric.js";

test("CappedCsatMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_072_679);
  const items: CappedCsatMetric[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedCsatMetric(`capped-csat-metric-${index}`, "sample"));
  }
  const report = buildCappedCsatMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
