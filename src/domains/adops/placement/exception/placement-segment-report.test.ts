import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementSegmentReport } from "./placement-segment-report.js";
import { PlacementSegment, newPlacementSegment } from "./placement-segment.js";

test("PlacementSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_165_578);
  const items: PlacementSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPlacementSegment(`placement-segment-${index}`, "sample"));
  }
  const report = buildPlacementSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
