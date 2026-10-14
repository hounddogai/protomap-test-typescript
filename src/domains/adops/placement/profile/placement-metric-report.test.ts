import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementMetricReport } from "./placement-metric-report.js";
import { PlacementMetric, newPlacementMetric } from "./placement-metric.js";

test("PlacementMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_765_615);
  const items: PlacementMetric[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPlacementMetric(`placement-metric-${index}`, "sample"));
  }
  const report = buildPlacementMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
