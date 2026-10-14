import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedSenderSegmentReport } from "./weighted-sender-segment-report.js";
import { WeightedSenderSegment, newWeightedSenderSegment } from "./weighted-sender-segment.js";

test("WeightedSenderSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_029_766);
  const items: WeightedSenderSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedSenderSegment(`weighted-sender-segment-${index}`, "sample"));
  }
  const report = buildWeightedSenderSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
