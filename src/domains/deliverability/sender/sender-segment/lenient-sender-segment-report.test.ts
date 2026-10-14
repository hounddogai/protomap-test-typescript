import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSenderSegmentReport } from "./lenient-sender-segment-report.js";
import { LenientSenderSegment, newLenientSenderSegment } from "./lenient-sender-segment.js";

test("LenientSenderSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_229_098);
  const items: LenientSenderSegment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientSenderSegment(`lenient-sender-segment-${index}`, "sample"));
  }
  const report = buildLenientSenderSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
