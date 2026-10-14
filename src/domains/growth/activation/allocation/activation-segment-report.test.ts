import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationSegmentReport } from "./activation-segment-report.js";
import { ActivationSegment, newActivationSegment } from "./activation-segment.js";

test("ActivationSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_435_272);
  const items: ActivationSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationSegment(`activation-segment-${index}`, "sample"));
  }
  const report = buildActivationSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
