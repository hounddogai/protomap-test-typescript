import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackQueueThresholdReport } from "./fallback-queue-threshold-report.js";
import { FallbackQueueThreshold, newFallbackQueueThreshold } from "./fallback-queue-threshold.js";

test("FallbackQueueThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_708_510);
  const items: FallbackQueueThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackQueueThreshold(`fallback-queue-threshold-${index}`, "sample"));
  }
  const report = buildFallbackQueueThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
