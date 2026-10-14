import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightSegmentReport } from "./insight-segment-report.js";
import { InsightSegment, newInsightSegment } from "./insight-segment.js";

test("InsightSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_568_278);
  const items: InsightSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newInsightSegment(`insight-segment-${index}`, "sample"));
  }
  const report = buildInsightSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
