import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCsatThresholdReport } from "./adaptive-csat-threshold-report.js";
import { AdaptiveCsatThreshold, newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("AdaptiveCsatThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_230_292);
  const items: AdaptiveCsatThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveCsatThreshold(`adaptive-csat-threshold-${index}`, "sample"));
  }
  const report = buildAdaptiveCsatThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
