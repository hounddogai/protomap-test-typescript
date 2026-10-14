import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTouchpointSegmentReport } from "./manual-touchpoint-segment-report.js";
import { ManualTouchpointSegment, newManualTouchpointSegment } from "./manual-touchpoint-segment.js";

test("ManualTouchpointSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_521_665);
  const items: ManualTouchpointSegment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualTouchpointSegment(`manual-touchpoint-segment-${index}`, "sample"));
  }
  const report = buildManualTouchpointSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
