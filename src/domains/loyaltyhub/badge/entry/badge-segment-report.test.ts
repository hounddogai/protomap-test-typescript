import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeSegmentReport } from "./badge-segment-report.js";
import { BadgeSegment, newBadgeSegment } from "./badge-segment.js";

test("BadgeSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_682_647);
  const items: BadgeSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBadgeSegment(`badge-segment-${index}`, "sample"));
  }
  const report = buildBadgeSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
