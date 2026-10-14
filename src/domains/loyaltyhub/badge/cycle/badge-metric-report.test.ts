import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeMetricReport } from "./badge-metric-report.js";
import { BadgeMetric, newBadgeMetric } from "./badge-metric.js";

test("BadgeMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_976_123);
  const items: BadgeMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBadgeMetric(`badge-metric-${index}`, "sample"));
  }
  const report = buildBadgeMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
