import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWarmupThresholdReport } from "./scheduled-warmup-threshold-report.js";
import { ScheduledWarmupThreshold, newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("ScheduledWarmupThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_923_438);
  const items: ScheduledWarmupThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledWarmupThreshold(`scheduled-warmup-threshold-${index}`, "sample"));
  }
  const report = buildScheduledWarmupThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
