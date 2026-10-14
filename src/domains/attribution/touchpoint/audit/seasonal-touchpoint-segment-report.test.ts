import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalTouchpointSegmentReport } from "./seasonal-touchpoint-segment-report.js";
import { SeasonalTouchpointSegment, newSeasonalTouchpointSegment } from "./seasonal-touchpoint-segment.js";

test("SeasonalTouchpointSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_905_511);
  const items: SeasonalTouchpointSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalTouchpointSegment(`seasonal-touchpoint-segment-${index}`, "sample"));
  }
  const report = buildSeasonalTouchpointSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
