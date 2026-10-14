import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepSegmentReport } from "./step-segment-report.js";
import { StepSegment, newStepSegment } from "./step-segment.js";

test("StepSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_823_481);
  const items: StepSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStepSegment(`step-segment-${index}`, "sample"));
  }
  const report = buildStepSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
