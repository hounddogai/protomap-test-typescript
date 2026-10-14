import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelSegmentReport } from "./model-segment-report.js";
import { ModelSegment, newModelSegment } from "./model-segment.js";

test("ModelSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_334_366);
  const items: ModelSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newModelSegment(`model-segment-${index}`, "sample"));
  }
  const report = buildModelSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
