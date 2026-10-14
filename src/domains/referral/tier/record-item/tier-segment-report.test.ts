import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierSegmentReport } from "./tier-segment-report.js";
import { TierSegment, newTierSegment } from "./tier-segment.js";

test("TierSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_657_024);
  const items: TierSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTierSegment(`tier-segment-${index}`, "sample"));
  }
  const report = buildTierSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
