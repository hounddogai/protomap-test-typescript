import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCreativeSegmentReport } from "./pending-creative-segment-report.js";
import { PendingCreativeSegment, newPendingCreativeSegment } from "./pending-creative-segment.js";

test("PendingCreativeSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_400_832);
  const items: PendingCreativeSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingCreativeSegment(`pending-creative-segment-${index}`, "sample"));
  }
  const report = buildPendingCreativeSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
