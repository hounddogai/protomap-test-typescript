import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPreferenceSegmentReport } from "./default-preference-segment-report.js";
import { DefaultPreferenceSegment, newDefaultPreferenceSegment } from "./default-preference-segment.js";

test("DefaultPreferenceSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_342_982);
  const items: DefaultPreferenceSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultPreferenceSegment(`default-preference-segment-${index}`, "sample"));
  }
  const report = buildDefaultPreferenceSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
