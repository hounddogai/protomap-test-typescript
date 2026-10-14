import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalConversionSegmentReport } from "./global-conversion-segment-report.js";
import { GlobalConversionSegment, newGlobalConversionSegment } from "./global-conversion-segment.js";

test("GlobalConversionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_845_145);
  const items: GlobalConversionSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalConversionSegment(`global-conversion-segment-${index}`, "sample"));
  }
  const report = buildGlobalConversionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
