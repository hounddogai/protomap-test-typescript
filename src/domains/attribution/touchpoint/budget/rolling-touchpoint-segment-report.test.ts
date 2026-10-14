import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingTouchpointSegmentReport } from "./rolling-touchpoint-segment-report.js";
import { RollingTouchpointSegment, newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("RollingTouchpointSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_225_986);
  const items: RollingTouchpointSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingTouchpointSegment(`rolling-touchpoint-segment-${index}`, "sample"));
  }
  const report = buildRollingTouchpointSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
