import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackInsightAdjustmentReport } from "./fallback-insight-adjustment-report.js";
import { FallbackInsightAdjustment, newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

test("FallbackInsightAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_896_056);
  const items: FallbackInsightAdjustment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackInsightAdjustment(`fallback-insight-adjustment-${index}`, "sample"));
  }
  const report = buildFallbackInsightAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
