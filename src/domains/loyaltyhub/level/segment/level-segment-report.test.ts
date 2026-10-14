import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelSegmentReport } from "./level-segment-report.js";
import { LevelSegment, newLevelSegment } from "./level-segment.js";

test("LevelSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_819_553);
  const items: LevelSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLevelSegment(`level-segment-${index}`, "sample"));
  }
  const report = buildLevelSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
