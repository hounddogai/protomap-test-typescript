import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSuppressionSegmentReport } from "./seasonal-suppression-segment-report.js";
import { SeasonalSuppressionSegment, newSeasonalSuppressionSegment } from "./seasonal-suppression-segment.js";

test("SeasonalSuppressionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_819_912);
  const items: SeasonalSuppressionSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalSuppressionSegment(`seasonal-suppression-segment-${index}`, "sample"));
  }
  const report = buildSeasonalSuppressionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
