import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceSegmentReport } from "./bounce-segment-report.js";
import { BounceSegment, newBounceSegment } from "./bounce-segment.js";

test("BounceSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_155_866);
  const items: BounceSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBounceSegment(`bounce-segment-${index}`, "sample"));
  }
  const report = buildBounceSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
