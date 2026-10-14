import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceSegmentReport } from "./preference-segment-report.js";
import { PreferenceSegment, newPreferenceSegment } from "./preference-segment.js";

test("PreferenceSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_366_156);
  const items: PreferenceSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPreferenceSegment(`preference-segment-${index}`, "sample"));
  }
  const report = buildPreferenceSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
