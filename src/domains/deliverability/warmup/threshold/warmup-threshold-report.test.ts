import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupThresholdReport } from "./warmup-threshold-report.js";
import { WarmupThreshold, newWarmupThreshold } from "./warmup-threshold.js";

test("WarmupThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_997_961);
  const items: WarmupThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWarmupThreshold(`warmup-threshold-${index}`, "sample"));
  }
  const report = buildWarmupThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
