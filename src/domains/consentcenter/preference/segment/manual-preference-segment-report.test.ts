import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPreferenceSegmentReport } from "./manual-preference-segment-report.js";
import { ManualPreferenceSegment, newManualPreferenceSegment } from "./manual-preference-segment.js";

test("ManualPreferenceSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_694_408);
  const items: ManualPreferenceSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualPreferenceSegment(`manual-preference-segment-${index}`, "sample"));
  }
  const report = buildManualPreferenceSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
